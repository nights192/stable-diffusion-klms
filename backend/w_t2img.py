import argparse, os, sys, glob
import time
import torch
import numpy as np

from omegaconf import OmegaConf
from PIL import Image
from tqdm import tqdm, trange
from itertools import islice
from einops import rearrange
from torchvision.utils import make_grid
from pytorch_lightning import seed_everything
from torch import autocast
from contextlib import contextmanager, nullcontext

import accelerate
import k_diffusion as K
import torch.nn as nn

from ldm.util import instantiate_from_config
from ldm.models.diffusion.ddim import DDIMSampler
from ldm.models.diffusion.plms import PLMSSampler

from split_subprompts import split_weighted_subprompts
from transformers import logging
logging.set_verbosity_error()

class Config():
    def __init__(self):
        self.config = 'optimizedSD/v1-inference.yaml' # Don't change this
        self.ckpt = ckpt # If you want to change the model location, change it on the Load movel section

        self.precision = 'autocast' # Change to full and fuck your RAM
        self.ddim_eta = 0.0 # Does nothing, keep as is
        self.C = 4 # Keep as is

        self.seed = 43

        self.ddim_steps = 50 # Keep within 30 ~ 250, higher is better but slower
        self.H = 512 # Height, the vertical resolution
        self.W = 512 # Width, the horizontal resolution
        self.f = 8 # Visual scale maybe, 256x256 with f = 4 seems to use same RAM as 512x512 with f = 8
        self.scale = 7.5 # Keep within 4 ~ 25, maybe, changes how the prompt is interpreted

        self.n_iter = 1 # Maybe improves it, reccomended to keep as is as it multiplies the waiting time
        self.n_samples = 4 # Amount of images outputted

opt = Config()
seed_everything(opt.seed)

def chunk(it, size):
    it = iter(it)
    return iter(lambda: tuple(islice(it, size)), ())

def load_model_from_config(ckpt, verbose=False):
    print(f"Loading model from {ckpt}")
    pl_sd = torch.load(ckpt, map_location="cuda:0")
    if "global_step" in pl_sd:
        print(f"Global Step: {pl_sd['global_step']}")
    sd = pl_sd["state_dict"]
    return sd

ckpt = '../models/ldm/stable-diffusion-v1/model.ckpt' # this points to the model that is in your root gdrive folder

sd = load_model_from_config(f"{ckpt}")
li = []
lo = []
for key, value in sd.items():
    sp = key.split('.')
    if(sp[0]) == 'model':
        if('input_blocks' in sp):
            li.append(key)
        elif('middle_block' in sp):
            li.append(key)
        elif('time_embed' in sp):
            li.append(key)
        else:
            lo.append(key)
for key in li:
    sd['model1.' + key[6:]] = sd.pop(key)
for key in lo:
    sd['model2.' + key[6:]] = sd.pop(key)

class CFGDenoiser(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.inner_model = model

    def forward(self, x, sigma, uncond, cond, cond_scale):
        x_in = torch.cat([x] * 2)
        sigma_in = torch.cat([sigma] * 2)
        cond_in = torch.cat([uncond, cond])
        uncond, cond = self.inner_model(x_in, sigma_in, cond=cond_in).chunk(2)
        return uncond + (cond - uncond) * cond_scale

def generate(opt, prompt, grid):
    accelerator = accelerate.Accelerator()
    device = accelerator.device
    images = []

    config = OmegaConf.load(f"{opt.config}")
    config.modelUNet.params.ddim_steps = opt.ddim_steps

    model = instantiate_from_config(config.modelUNet)
    _, _ = model.load_state_dict(sd, strict=False)
    model.eval()
        
    modelCS = instantiate_from_config(config.modelCondStage)
    _, _ = modelCS.load_state_dict(sd, strict=False)
    modelCS.eval()
        
    modelFS = instantiate_from_config(config.modelFirstStage)
    _, _ = modelFS.load_state_dict(sd, strict=False)
    modelFS.eval()

    if opt.precision == "autocast":
        model.half()
        modelCS.half()
        modelFS.half()

    model_wrap = K.external.CompVisDenoiser(model)
    sigma_min, sigma_max = model_wrap.sigmas[0].item(), model_wrap.sigmas[-1].item()

    seeds = torch.randint(-2 ** 63, 2 ** 63 - 1, [accelerator.num_processes])
    torch.manual_seed(seeds[accelerator.process_index].item())

    batch_size = opt.n_samples
    n_rows = opt.n_rows if opt.n_rows > 0 else batch_size

    assert prompt is not None
    data = [batch_size * [prompt]]

    start_code = torch.randn([opt.n_samples, opt.C, opt.H // opt.f, opt.W // opt.f], device=device)

    precision_scope = autocast if opt.precision=="autocast" else nullcontext
    with torch.no_grad():
        all_samples = list()
        with precision_scope("cuda"):
            for n in trange(opt.n_iter, desc="Sampling", disable =not accelerator.is_main_process):
                for prompts in tqdm(data, desc="data", disable =not accelerator.is_main_process):
                    modelCS.to(device)
                    uc = None
                    if opt.scale != 1.0:
                        uc = modelCS.get_learned_conditioning(batch_size * [""])
                    if isinstance(prompts, tuple):
                        prompts = list(prompts)

                    subprompts,weights = split_weighted_subprompts(prompts[0])
                    if len(subprompts) > 1:
                        c = torch.zeros_like(uc)
                        totalWeight = sum(weights)
                        # normalize each "sub prompt" and add it
                        for i in range(len(subprompts)):
                            weight = weights[i]
                            # if not skip_normalize:
                            weight = weight / totalWeight
                            c = torch.add(c,modelCS.get_learned_conditioning(subprompts[i]), alpha=weight)
                    else:
                        c = modelCS.get_learned_conditioning(prompts)

                    
                    shape = [opt.C, opt.H // opt.f, opt.W // opt.f]
                    mem = torch.cuda.memory_allocated()/1e6
                    modelCS.to("cpu")
                    while(torch.cuda.memory_allocated()/1e6 >= mem):
                        time.sleep(1)

                    sigmas = model_wrap.get_sigmas(opt.ddim_steps)
                    torch.manual_seed(opt.seed)
                    x = torch.randn([opt.n_samples, *shape], device=device) * sigmas[0] # for GPU draw
                    model_wrap_cfg = CFGDenoiser(model_wrap)
                    extra_args = {'cond': c, 'uncond': uc, 'cond_scale': opt.scale}
                    samples_ddim = K.sampling.sample_lms(model_wrap_cfg, x, sigmas, extra_args=extra_args, disable=not accelerator.is_main_process)
                    
                    modelFS.to(device)
                    for i in range(batch_size):
                        x_samples_ddim = modelFS.decode_first_stage(samples_ddim[i].unsqueeze(0))
                        x_samples_ddim = torch.clamp((x_samples_ddim + 1.0) / 2.0, min=0.0, max=1.0)
                        x_sample = accelerator.gather(x_samples_ddim)

                        if grid:
                            all_samples.append(x_sample)

                        x_sample = 255. * rearrange(x_sample[0].cpu().numpy(), 'c h w -> h w c')

                        images +=[Image.fromarray(x_sample.astype(np.uint8))]
                        
                    mem = torch.cuda.memory_allocated()/1e6
                    modelFS.to("cpu")
                    while(torch.cuda.memory_allocated()/1e6 >= mem):
                        time.sleep(1)

                    del samples_ddim
            if grid:
                grid = torch.stack(all_samples, 0)
                grid = rearrange(grid, 'n b c h w -> (n b) c h w')
                grid = make_grid(grid, nrow=n_rows)
                grid = 255. * rearrange(grid, 'c h w -> h w c').cpu().numpy()
                images = [Image.fromarray(grid.astype(np.uint8))] + images

            return images