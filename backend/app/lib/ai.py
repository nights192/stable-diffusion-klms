from cgitb import text
import functools
import torch
from omegaconf import OmegaConf
from itertools import islice
from ldm.util import instantiate_from_config
import k_diffusion as K

from .utils import image_array_to_hex
from .t2img import generate as text_generate

def chunk(it, size):
    it = iter(it)
    return iter(lambda: tuple(islice(it, size)), ())


def load_model_from_config(ckpt, verbose=False):
    print(f"Loading model from {ckpt}")
    pl_sd = torch.load(ckpt, map_location="cpu")
    if "global_step" in pl_sd:
        print(f"Global Step: {pl_sd['global_step']}")
    sd = pl_sd["state_dict"]
    return sd

@functools.lru_cache(maxsize=1)
def load_model():
    """Instantiate an instance of our ML model."""

    config = "../optimizedSD/v1-inference.yaml"
    ckpt = "../models/ldm/stable-diffusion-v1/model.ckpt"
    sd = load_model_from_config(f"{ckpt}")
    li, lo = [], []
    for key, v_ in sd.items():
        sp = key.split(".")
        if (sp[0]) == "model":
            if "input_blocks" in sp:
                li.append(key)
            elif "middle_block" in sp:
                li.append(key)
            elif "time_embed" in sp:
                li.append(key)
            else:
                lo.append(key)
    for key in li:
        sd["model1." + key[6:]] = sd.pop(key)
    for key in lo:
        sd["model2." + key[6:]] = sd.pop(key)

    config = OmegaConf.load(f"{config}")

    model = instantiate_from_config(config.modelUNet)
    _, _ = model.load_state_dict(sd, strict=False)
    model.eval()

    modelCS = instantiate_from_config(config.modelCondStage)
    _, _ = modelCS.load_state_dict(sd, strict=False)
    modelCS.eval()

    modelFS = instantiate_from_config(config.modelFirstStage)
    _, _ = modelFS.load_state_dict(sd, strict=False)
    modelFS.eval()
    del sd

    model_wrap = K.external.CompVisDenoiser(model)

    return (model, modelCS, modelFS, model_wrap)

def txt2img(argTable):
    prompt = argTable["prompt"]
    ddim_steps = argTable["steps"]
    batch_size = argTable["numImages"]
    height = argTable["height"]
    width = argTable["width"]
    scale = argTable["cfgScale"]
    seed = argTable["seed"]

    return image_array_to_hex(
        text_generate(*load_model(), prompt, ddim_steps, 1, batch_size, height, width, scale, 0, 1, "cuda", seed, False, False)
    )