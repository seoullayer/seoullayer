---
title: "Running Windows 11 on Proxmox: A Mac User's Escape Hatch in Korea"
description: "Why I run a Windows 11 VM on my Proxmox homelab, how dual ISO mounting made installation painless, and the Korean-specific reasons a Mac user still needs Windows."
pubDatetime: 2026-05-25T00:00:00Z
tags: ["homelab", "proxmox", "self-hosting", "windows", "korea"]
featured: false
draft: false
---

## Introduction

My daily driver is a MacBook Pro. macOS is where I do almost everything: work, browsing, writing, terminal sessions into my homelab. It is a comfortable environment and I have no intention of changing it.

But I live in Korea, and in Korea, being a Mac user means occasionally hitting a wall that no amount of preference or workflow optimization can get around.

Government websites that require specific security programs to function. Banks that technically support macOS but feel like they would rather you did not try. HWP documents that open on Mac but never quite render the same way as on Windows. Excel files with VBA macros that behave unpredictably in the Mac version of Office.

None of these are daily problems. Some of them are becoming less frequent as Korean institutions slowly improve their cross-platform support. But they never fully disappear. Every few weeks, something comes up that quietly demands Windows.

On my previous N100 mini PC, running a Windows VM was not realistic. The hardware was too limited to spare resources for a full desktop operating system alongside all the other services. When I upgraded to the i7-14700 server, that constraint disappeared. For the first time, I had enough headroom to run Windows 11 as a VM on Proxmox, available when I need it and shut down when I do not.

---

## Why a VM Instead of a Separate Machine

The obvious alternatives to a Proxmox VM are buying a separate Windows PC or running Boot Camp. Neither made sense for my situation.

A dedicated Windows machine means another computer in the apartment. More power consumption, more physical space in an already tight storage closet, and another system to maintain. All of that for something I use a few times a month.

Boot Camp is not an option because my MacBook has Apple Silicon. Even if it were Intel-based, rebooting into a different operating system every time I need to fill out a government form is not a workflow anyone would design on purpose.

A Proxmox VM fits naturally. The server is already running 24/7 with plenty of spare capacity most of the time. Creating a VM costs nothing beyond the disk space for the Windows installation. I can start it when I need it, connect through Remote Desktop from my Mac, do what I need to do, and shut it down. The VM does not consume meaningful resources when it is off, and Proxmox makes the entire lifecycle trivial to manage.

There is also a practical advantage that only became clear after I started using the VM regularly. Proxmox's snapshot and cloning capabilities mean that if anything goes wrong with the Windows installation — software conflicts, a bad update, accumulated bloat from security programs — I can restore a clean state in seconds. On a physical PC, that same recovery would mean a full reinstallation. On a VM, it is a single click.

---

## Dual ISO Mount: A Small Improvement That Matters

Installing Windows on Proxmox requires two ISO files: the Windows 11 installation media and the VirtIO driver package. Windows does not natively recognize VirtIO storage controllers or network adapters, so without the VirtIO drivers loaded during installation, the installer cannot see the virtual disk and has no network connectivity.

In older versions of Proxmox, handling this was awkward. You typically had to attach the VirtIO ISO as a secondary CD-ROM drive, switch between drives during the installation process to load drivers, and hope the installer cooperated. Some guides suggested using USB passthrough or modifying the ISO to embed the drivers. None of these approaches were difficult exactly, but they added friction to what should be a simple installation.

A recent Proxmox update made this significantly easier. You can now mount both ISO files simultaneously during VM creation — one as the primary CD-ROM and the other as a secondary drive. The Windows installer sees both drives. When it asks you to load drivers, you point it to the VirtIO ISO, load the storage and network drivers, and continue with the installation normally. No workarounds, no ISO modifications, no guesswork.

It is a small quality-of-life improvement, but it turned what used to be a mildly annoying process into something genuinely straightforward.

---

## Installation Notes

The installation itself is standard once the drivers are loaded, but there are a few things worth noting for anyone doing this for the first time.

### VM Configuration

When creating the VM in Proxmox, a few settings matter:

The machine type should be set to q35, and the BIOS to OVMF (UEFI). Windows 11 requires UEFI and TPM. Proxmox can emulate a TPM device, which satisfies Windows 11's hardware requirement without needing a physical TPM chip. Add the TPM state as part of the VM creation process.

For the disk controller, use VirtIO SCSI. This is the default in current Proxmox versions and provides the best performance. Just remember that Windows will not see the disk until you load the VirtIO storage driver during installation.

For the network adapter, use VirtIO as well. The same applies: no connectivity until the driver is loaded, but performance is significantly better than emulating a standard Intel NIC.

I allocated 4 CPU cores and 16GB of memory, which is comfortable for occasional desktop use. Whether 16GB is necessary depends on what you plan to do. For basic tasks like web browsing and document editing, 8GB would be sufficient. I chose 16GB because I occasionally run Excel with large spreadsheets and wanted some headroom.

### Loading Drivers During Installation

When the Windows installer reaches the disk selection screen and shows no drives, click "Load driver" and browse to the VirtIO secondary CD-ROM. Navigate to the `vioscsi` folder, then the subfolder matching your Windows version and architecture (typically `w11/amd64`). Select the driver and the disk will appear.

For network connectivity during installation, you can load the NetKVM driver from the same VirtIO ISO at this stage as well, though it is not strictly required during installation. Network can be configured after the OS is installed.

### Post-Installation: Guest Tools

After Windows is installed and booted, the first thing to do is mount the VirtIO ISO again and run `virtio-win-guest-tools.exe`. This installs all remaining VirtIO drivers and the QEMU Guest Agent in one step.

The QEMU Guest Agent is particularly important. Without it, Proxmox cannot see the VM's IP address, cannot perform clean shutdowns, and cannot take consistent snapshots. With it installed, the VM becomes a fully cooperative citizen of the Proxmox environment.

There is one additional setting that I covered in detail in my previous post about Proxmox tips, but it is worth repeating briefly here: make sure the Ballooning Device is enabled in the VM's memory configuration. Guest tools install the balloon driver inside Windows, but the device itself must be enabled on the Proxmox side. Without it, Proxmox reports the VM's memory usage as 100% regardless of actual consumption, which wastes host memory and can cause swap issues on the host. Enabling it fixed both problems immediately in my case.

---

## The Korean Mac User's Problem

This section is specific to Korea, but it explains why the Windows VM exists at all.

### Government Websites and Security Programs

Korean government and public service websites have historically required specific security software to function: identity verification modules, encryption layers, and keyboard security programs. The situation has improved substantially. ActiveX is gone from most sites, and many government services now work on macOS and mobile browsers without issues.

But some sites I use for work still require Windows. The frequency has decreased, and it is no longer a daily problem, but it has not reached zero either. When it happens, having a Windows VM means I do not have to care. I open the VM, do what I need, and close it.

There is a secondary benefit that turned out to be just as valuable. Korean websites tend to require multiple security programs to be installed simultaneously, and over time these programs accumulate. They run background processes, conflict with each other, and gradually slow the system down. On a physical PC, cleaning this up means manually uninstalling programs or, in the worst case, reinstalling Windows.

On a Proxmox VM, the solution is trivial. I keep a snapshot of a clean Windows installation. When the security program bloat becomes noticeable, I roll back to the snapshot and start fresh. The entire process takes seconds. This alone makes the VM approach superior to running Windows on dedicated hardware, at least for this particular use case.

### HWP Documents

HWP is the file format used by Hancom Office, which remains the standard document format in Korean government and many Korean organizations. Hancom has a macOS version, and basic documents open fine. But complex formatting, tables, and embedded objects do not always render correctly cross-platform.

For documents I only need to read, the Mac version is usually sufficient. For documents I need to edit and send back, especially to government agencies or formal business contexts where formatting matters, doing it in Windows eliminates any risk of layout issues on the recipient's end.

### Excel and VBA

This is less Korea-specific and more of a general Mac pain point. Microsoft Excel on macOS has improved dramatically over the years, but VBA support still feels like a second-class citizen. Macros that work perfectly on Windows Excel sometimes behave differently or fail entirely on Mac.

For my use case, this comes up occasionally with complex spreadsheets that rely on VBA automation. The stakes are usually high enough (financial calculations, reporting templates) that I do not want to wonder whether a discrepancy is a real error or a Mac-specific compatibility issue. Running it in Windows removes that doubt.

### Banking

Korean bank websites have historically been notorious for requiring Windows and Internet Explorer. This has improved dramatically, and most major banks now work on macOS and mobile. I do not currently use the Windows VM for banking, but knowing it is available if a specific bank transaction requires it provides a certain peace of mind.

---

## On-Demand Operation

The Windows VM is not a permanent service. Unlike Home Assistant or Nextcloud, which run continuously, the Windows VM starts when I need it and shuts down when I am done.

This is a deliberate choice driven by resource management. With ballooning enabled, the VM uses around 2.7GB of host memory when idle — modest, but not zero. More importantly, Windows consumes CPU cycles for background tasks, updates, and services even when you are not actively using it. On a homelab that runs 24/7 in an apartment where every watt is accounted for, those idle resources add up.

The practical workflow is simple. When I need Windows, I start the VM from the Proxmox web interface or the mobile app. It boots in under a minute. I connect via Microsoft Remote Desktop from my MacBook, which provides a smooth and responsive experience over the local network. When I am done, I shut down the VM from within Windows.

One operational note: because the VM is not always running, I excluded it from Grafana's VM monitoring alerts. Without that exclusion, every shutdown triggered a "VM DOWN" notification to Telegram. The alert is designed to catch unexpected failures in always-on services, not intentional shutdowns of on-demand VMs. I covered the details of how to configure this exclusion in my Proxmox tips post.

Scheduled backups are also handled differently. The Windows VM is excluded from the daily 4 AM backup job because it is usually powered off at that time, and its state changes infrequently. Instead, I take manual snapshots before and after significant changes, like installing new software or updating drivers.

---

## Lessons Learned

The most important realization was that I had been treating the Windows VM as a compromise — something I reluctantly needed because Korea forced me to. In practice, it turned out to be a surprisingly clean solution.

A Windows VM on Proxmox is not a clunky workaround. With VirtIO drivers, guest tools, and Remote Desktop, the experience is smooth enough that I sometimes forget I am connected to a virtual machine on a server in my storage closet rather than a physical PC sitting in front of me.

The dual ISO mount improvement in Proxmox deserves recognition. Small quality-of-life changes like that make the difference between an installation process that feels like a chore and one that feels routine.

For anyone in Korea using a Mac as their primary machine, a Windows VM is worth considering if you already have a homelab with spare capacity. The setup takes an afternoon. The result is a Windows environment that is always available when you need it and completely out of the way when you do not.

And for the broader homelab audience: on-demand VMs are a different operational pattern from always-on services, and they need to be managed differently. Monitoring, alerting, backups, and resource allocation all need to account for the fact that the VM will be off most of the time. Treating an on-demand VM like a permanent service leads to exactly the kind of problems I described — false alerts, unnecessary resource consumption, and swap pressure from a balloon driver that was never enabled.

The homelab started with a bathroom wiring problem and now runs a Windows VM so I can file government documents from my Mac. The path between those two points makes no sense in hindsight, but each step was logical at the time. That seems to be how homelabs work.
