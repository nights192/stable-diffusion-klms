import numpy as np
import torch
from torchvision.utils import make_grid
from einops import rearrange
import os, re
from PIL import Image
import torch
import numpy as np
from random import randint
from omegaconf import OmegaConf
from PIL import Image
from tqdm import tqdm, trange
from einops import rearrange
from torchvision.utils import make_grid
import time
from pytorch_lightning import seed_everything
from torch import autocast
import k_diffusion as K
from optimizedSD.klms.sampling import CFGDenoiser
from contextlib import nullcontext
from optimizedSD.optimUtils import split_weighted_subprompts, logger
from transformers import logging
from typing import List

logging.set_verbosity_error()

def generate(
    model,
    modelCS,
    modelFS,
    model_wrap,
    prompt,
    ddim_steps,
    n_iter,
    batch_size,
    Height,
    Width,
    scale,
    ddim_eta,
    unet_bs,
    device,
    seed,
    turbo,
    full_precision,
):

    C = 4
    f = 8
    start_code = None
    model.unet_bs = unet_bs
    model.turbo = turbo
    model.cdevice = device
    modelCS.cond_stage_model.device = device

    if seed == "":
        seed = randint(0, 1000000)
    seed = int(seed)
    seed_everything(seed)

    if device != "cpu" and full_precision == False:
        model.half()
        modelFS.half()
        modelCS.half()

    tic = time.time()
    
    # n_rows = opt.n_rows if opt.n_rows > 0 else batch_size
    assert prompt is not None
    data = [batch_size * [prompt]]

    if full_precision == False and device != "cpu":
        precision_scope = autocast
    else:
        precision_scope = nullcontext

    results: List[Image.Image] = []
    all_samples = []
    seeds = ""
    with torch.no_grad():

        all_samples = list()
        for _ in trange(n_iter, desc="Sampling"):
            for prompts in tqdm(data, desc="data"):
                with precision_scope("cuda"):
                    model_wrap.to(device)
                    modelCS.to(device)
                    uc = None
                    if scale != 1.0:
                        uc = modelCS.get_learned_conditioning(batch_size * [""])
                    if isinstance(prompts, tuple):
                        prompts = list(prompts)

                    subprompts, weights = split_weighted_subprompts(prompts[0])
                    if len(subprompts) > 1:
                        c = torch.zeros_like(uc)
                        totalWeight = sum(weights)
                        # normalize each "sub prompt" and add it
                        for i in range(len(subprompts)):
                            weight = weights[i]
                            # if not skip_normalize:
                            weight = weight / totalWeight
                            c = torch.add(c, modelCS.get_learned_conditioning(subprompts[i]), alpha=weight)
                    else:
                        c = modelCS.get_learned_conditioning(prompts)

                    shape = [C, Height // f, Width // f]

                    if device != "cpu":
                        mem = torch.cuda.memory_allocated() / 1e6
                        modelCS.to("cpu")
                        while torch.cuda.memory_allocated() / 1e6 >= mem:
                            time.sleep(1)

                    # Conversion to k_lms begins in proper here.
                    model.make_schedule(ddim_num_steps=ddim_steps, ddim_eta=ddim_eta, verbose=False)
                    sigmas = model_wrap.get_sigmas(ddim_steps)
                    model_wrap_cfg = CFGDenoiser(model_wrap)

                    torch.manual_seed(seed)

                    x = torch.randn([batch_size, *shape], device=device) * sigmas[0]
                    extra_args = {'cond': c, 'uncond': uc, 'cond_scale': scale}
                    
                    samples_ddim = K.sampling.sample_lms(model_wrap_cfg, x, sigmas, extra_args=extra_args, disable=False)

                    # samples_ddim = model.sample(
                    #     S=ddim_steps,
                    #     conditioning=c,
                    #     batch_size=batch_size,
                    #     seed=seed,
                    #     shape=shape,
                    #     verbose=False,
                    #     unconditional_guidance_scale=scale,
                    #     unconditional_conditioning=uc,
                    #     eta=ddim_eta,
                    #     x_T=start_code,
                    # )

                    modelFS.to(device)
                    print("saving images")

                    for i in range(batch_size):

                        x_samples_ddim = modelFS.decode_first_stage(samples_ddim[i].unsqueeze(0))
                        x_sample = torch.clamp((x_samples_ddim + 1.0) / 2.0, min=0.0, max=1.0)
                        all_samples.append(x_sample.to("cpu"))
                        x_sample = 255.0 * rearrange(x_sample[0].cpu().numpy(), "c h w -> h w c")
                        results.append(Image.fromarray(x_sample.astype(np.uint8)))
                        seeds += str(seed) + ","
                        seed += 1
                        base_count += 1

                    if device != "cpu":
                        mem = torch.cuda.memory_allocated() / 1e6
                        modelFS.to("cpu")
                        while torch.cuda.memory_allocated() / 1e6 >= mem:
                            time.sleep(1)

                    del samples_ddim
                    del x_sample
                    del x_samples_ddim

    return results