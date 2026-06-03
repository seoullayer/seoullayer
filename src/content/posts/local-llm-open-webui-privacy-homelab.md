---
title: "Running a Local LLM: Why I Self-Host AI for the Things I Can't Send to the Cloud"
description: "Why I run Gemma 4 E4B locally on a MacBook with LM Studio and Open WebUI, how it fits into my Obsidian workflow, and the honest tradeoffs of a 16GB machine."
pubDatetime: 2026-06-03T14:00:00Z
tags: ["homelab", "self-hosting", "llm", "ai", "privacy", "obsidian"]
featured: false
draft: false
---

*This post is part of the [Korean Apartment Homelab](/series) series.*

## Introduction

The obvious objection to running a language model on your own hardware is that the cloud models are better. They are larger, faster, smarter, and someone else maintains them. Against a frontier model running in a datacenter, a 4-bit model on a laptop is not a fair fight, and pretending otherwise would be dishonest.

So why run one locally at all?

The answer has nothing to do with performance. It is about boundaries. Some information should never leave your machine, not because it is illegal or dangerous, but because it is yours. Private notes, work context, half-formed ideas, personal details that happen to be in the same document as the thing you actually want help with. The moment you paste that into a cloud service, it has left your control. It is processed on someone else's hardware, possibly logged, possibly used for training, and definitely no longer private in any meaningful sense.

A local model does not have that problem, because nothing leaves. That single property changes what you are willing to ask, and once I started using one seriously, it became a permanent part of how I work rather than a novelty I tried once. This post is about why, how it is set up, and where the limits actually are.

---

## The Stack

The setup is deliberately simple. The model runs on my MacBook Pro (M1 Pro, 16GB), the same machine I covered in the cost post, usually in clamshell mode with an external monitor. There is no dedicated GPU server and no separate inference box. The Mac does the work.

The runtime is [LM Studio](https://lmstudio.ai/), which loads the model and exposes it through a local API. LM Studio handles the parts that are tedious to do by hand: downloading models in the right format, managing them, and serving an OpenAI-compatible endpoint that other applications can talk to. On Apple Silicon it uses the Mac's unified memory and Metal acceleration, which is what makes running a model on a laptop practical at all.

On top of that sit two different front ends, because I use local AI in two distinct ways. One is inside Obsidian, through the Copilot plugin, for working with my notes. The other is Open WebUI, for direct conversation when I want to ask something the way I would ask a chat assistant. Both talk to the same LM Studio backend, but they serve different purposes, and it is worth describing each separately because together they explain why local AI earns its place.

As I mentioned in the Cloudflare Access post, Open WebUI is the one service I expose through Cloudflare Access rather than keeping purely local, since it is browser-based and benefits from being reachable. The model and the runtime, however, never leave the Mac.

---

## How I Actually Use It, Part One: Obsidian

The use I reach for most is not dramatic. It is writing notes.

I keep my notes in Obsidian, and the way I work is to jot something down quickly and roughly: a few fragments, an incomplete thought, the shape of an idea before it is actually an idea. On their own, those fragments are not much use later. Six months from now, a three-line scribble will not mean anything to me.

The Copilot plugin for Obsidian connects directly to LM Studio, so the local model is available right inside my notes. I built a command that takes a rough note and expands it into something coherent: properly written, filled out, structured enough that future me can actually use it. I jot the fragments, run the command, and the scribble becomes a note worth keeping. That single workflow has changed how I capture things, because the cost of writing something down properly has dropped to almost nothing.

Here is why this specifically has to be local. My Obsidian vault is years of accumulated thinking. It contains personal information, private context, work details, and a great deal that I would never paste into a cloud service. The value of an in-editor AI command is that it operates on whatever note I am in, which means it has to be allowed to see that note. If that command were wired to a cloud API, I would be sending pieces of my most private repository to a third party every time I used it, and the convenience would not be worth it. With a local model, the note never leaves the laptop. The processing happens in memory on my own machine and nothing is transmitted anywhere. That is the only arrangement under which I am comfortable pointing an AI at my notes at all.

---

## How I Actually Use It, Part Two: Open WebUI

The second use is more straightforward and harder to talk about precisely, but it matters just as much.

There are questions I would hesitate to type into a commercial AI service. Not because they are improper, but because a question can itself be revealing. The thing you are curious about, the problem you are trying to solve, the situation you are quietly working through, all of these say something about you, and all of them get logged when you ask a cloud service. Most of the time that is a fine trade. Sometimes it is not.

For those, I use Open WebUI pointed at the local model. The question goes to my own machine, gets answered, and that is the end of it. Nothing is transmitted, nothing is stored on anyone else's server, nothing becomes a row in a training dataset or a log entry tied to my account. The interesting effect is that the ceiling on what I am willing to ask simply lifts. When you know a question genuinely goes nowhere, you stop self-censoring the small private curiosities that you would otherwise keep to yourself. It turns out a surprising amount of ordinary thinking falls into that category once the privacy cost is removed.

This is the part that is hard to appreciate until you have it. The value is not that the local model answers better, because it does not. The value is that it removes a constraint you may not have noticed you were operating under.

---

## The Honest Tradeoffs

If this reads like local AI has replaced cloud AI for me, it has not, and the reasons are worth being precise about.

The model I run is Gemma 4 E4B, quantized to 4-bit, which lands at roughly 4.3GB on disk. It is a capable small model, genuinely useful for note expansion and everyday questions. But it is a small model, and on tasks that need real reasoning depth, long context, or current knowledge, a frontier cloud model is plainly better. I am not pretending the gap does not exist. For hard problems, I still use commercial services, with information I am comfortable sending.

The bigger day-to-day constraint is memory. 16GB is not much headroom once you account for everything else a working machine is doing: the browser, the editor, whatever else is open. The model needs a few gigabytes of that, and on a 16GB machine those gigabytes are contested. The practical consequence is that I do not keep the model loaded all the time. I load it when I need it and unload it when I am done, rather than letting it sit resident and squeeze everything else. It is a minor friction, but an honest one, and anyone considering this on a 16GB machine should expect the same. If I had 32GB or more, I would simply leave it loaded; at 16GB, load-and-unload is the realistic pattern.

This shapes the whole approach, and it is the actual takeaway. I do not run local AI because it is better. I run it for a specific job: the work that involves information I will not send elsewhere. For everything else, the cloud is fine. The decision of which to use is not about which is smarter on a given task. It is about which side of the privacy boundary the task falls on. Sensitive context stays local. Everything else can go to the cloud. That division, rather than any single tool, is what actually works.

---

## Lessons Learned

**The reason to run local AI is privacy, not performance.** A small local model will not beat a frontier cloud model on capability. What it offers is that nothing leaves your machine, which is the only thing that matters for sensitive work. Choose local for the boundary it provides, not because you expect it to be smarter.

**An in-editor AI has to see your editor's contents, so it must be trustworthy with them.** Pointing a cloud API at a private notes vault means sending that vault out piece by piece. A local model is the arrangement that makes an in-editor assistant acceptable, because the note never leaves the machine.

**On 16GB, expect to load and unload.** A 4-bit small model is a few gigabytes, and on a 16GB machine doing other work, that memory is contested. Loading on demand rather than keeping the model resident is the realistic pattern. More RAM removes this friction; without it, plan for it.

**Use the boundary, not one tool, to decide.** The useful mental model is not "local versus cloud" as a loyalty. It is a line: sensitive information stays local, everything else can go to the cloud. Sorting tasks by which side of that line they fall on is what makes both worth having.

---

## What's Next

The clearest limitation here is the hardware. Everything about this setup, the small model, the load-and-unload dance, the deferral of hard problems to the cloud, traces back to running inference on a 16GB laptop that also has a day job. A machine with more memory, or a dedicated inference box in the homelab, would change the calculation: a larger model could stay resident, handle more of the work locally, and push the privacy boundary further so that fewer tasks need to leave the machine at all. Whether that is worth the cost and the added power draw is the open question, and it is the kind of tradeoff this series keeps coming back to.

For now, the value is clear enough to justify the friction. The local model is not the smartest tool I have, but it is the only one I trust with the things that should never leave home, and that turns out to be worth a great deal.

The homelab keeps growing, one layer at a time.
