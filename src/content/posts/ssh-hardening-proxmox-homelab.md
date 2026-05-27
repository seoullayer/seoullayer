---
title: "SSH Hardening on Proxmox: More Secure and More Convenient"
description: "How I switched from password to key-based SSH authentication on my Proxmox homelab, why it ended up being easier than before, and the iPhone compatibility issue I did not expect."
pubDatetime: 2026-05-27T00:00:00Z
tags: ["homelab", "proxmox", "self-hosting", "security", "ssh"]
featured: false
draft: false
---

## Introduction

Every post in this series that touches security has ended with the same unfinished item: SSH hardening. The Proxmox host, the machine that runs everything else, was still using default SSH settings. Password authentication enabled, no key requirement, nothing changed from the day I installed Proxmox.

It was not that I thought it was fine. The server sits behind a firewall with no SSH port exposed to the internet, so the immediate risk was low. But "low risk" is not "no risk," and after setting up Cloudflare Tunnel and Access to protect my services, having the host itself secured by nothing more than a password felt inconsistent.

What I did not expect was that the security upgrade would also be a convenience upgrade. After switching to key-based authentication, I no longer type a password to connect to my server. I open a terminal, type `ssh root@` and the IP address, and I am in. The authentication happens invisibly through the key exchange. It is both more secure and faster than what I had before.

This post covers the setup, one device compatibility issue that required a workaround, and why I think SSH key authentication is the single easiest security improvement a homelab owner can make.

---

## What Key-Based Authentication Changes

With password authentication, anyone who knows the server's IP address and can reach port 22 can attempt to log in. The only barrier is the password. Automated brute-force tools can try thousands of passwords per minute, and while a strong password makes success unlikely, the attack surface exists.

With key-based authentication, the server only accepts connections from devices that possess a specific cryptographic key. No key, no connection. The server does not even present a password prompt. From an attacker's perspective, there is nothing to try. The door does not have a keyhole they can pick.

The keys come in pairs. A private key stays on your device and never leaves it. A public key is placed on the server. When you connect, the server challenges your device to prove it holds the matching private key. If it does, you are in. If it does not, the connection is refused. No password is involved at any point.

---

## The Setup

The entire process took less than fifteen minutes, including the iPhone workaround. Here is what I did.

### Generating the Key

On my MacBook, I generated an ED25519 key pair:

```bash
ssh-keygen -t ed25519 -C "seoullayer-proxmox"
```

The command asks for a file location (I used the default) and a passphrase. The passphrase is a secondary protection layer: if someone copies your private key file, they still need the passphrase to use it. I set one, which turned out to matter later for iPhone compatibility.

### Copying the Public Key to the Server

```bash
ssh-copy-id root@<server-IP>
```

This command logs in with the existing password one last time and installs the public key on the server. After this, the server recognizes the MacBook's key.

### Testing Key Authentication

Before changing anything else, I verified that key authentication worked by opening a new terminal and connecting:

```bash
ssh root@<server-IP>
```

The connection went through without asking for a password. It asked for the key passphrase instead, which confirmed the key was being used rather than the password.

### Saving the Passphrase to macOS Keychain

Typing the passphrase every time would have been more inconvenient than the password it replaced. On macOS, you can store it in the system keychain:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

After entering the passphrase once, macOS remembers it. Every subsequent SSH connection is fully automatic. Terminal opens, command runs, and I am on the server. No password, no passphrase prompt, nothing. This is the moment where the security upgrade became a convenience upgrade.

### Disabling Password Authentication

With key authentication confirmed working, I disabled password login on the server:

```bash
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

I verified by explicitly attempting a password-only connection:

```bash
ssh -o PubkeyAuthentication=no root@<server-IP>
```

Permission denied. Password authentication is gone.

One important safety note: I kept an existing SSH session open throughout this entire process. If something had gone wrong with the key configuration, that session would have been my way back in. Never disable password authentication and close your only active session at the same time.

---

## The iPhone Problem

I use Easy SSH on my iPhone for occasional server access. After completing the hardening on my MacBook, I exported the private key to my iPhone through Vaultwarden and tried to connect.

The app refused the key with a clear error message: encrypted ED25519 keys are not supported.

The issue is that my private key was generated with a passphrase, which means the key file is encrypted. Easy SSH, at the time of writing, does not support decrypting ED25519 keys with a passphrase. It is a limitation of the app, not of the key format itself.

The solution was to generate a second key pair specifically for the iPhone, without a passphrase:

```bash
ssh-keygen -t ed25519 -C "seoullayer-iphone" -f ~/.ssh/id_ed25519_iphone -N ""
ssh-copy-id -i ~/.ssh/id_ed25519_iphone root@<server-IP>
```

The `-N ""` flag creates the key without a passphrase, and `-f` specifies a different filename so it does not overwrite the MacBook key. After registering this key on the server and importing it into Easy SSH, the iPhone connected without issues.

This means I now have two keys registered on the server: a passphrase-protected key for the MacBook and an unprotected key for the iPhone. The trade-off is that if someone gains access to the iPhone key file, they can use it without any additional authentication. For my use case, where the iPhone is protected by Face ID and the server is only reachable on the local network or through VPN, this is an acceptable risk. For a server exposed directly to the internet, I would not recommend an unprotected key.

---

## What If I Lose My Keys?

This is the first question that came to mind after disabling password authentication. If the MacBook dies and the iPhone is lost, am I locked out of my own server?

No. Proxmox's web console is completely independent of SSH. Accessing `https://<server-IP>:8006` in a browser and logging in with the root password still works exactly as before. SSH hardening does not affect the web interface at all.

From the web console, I can open a shell, re-enable password authentication, or register a new key. The recovery path exists, and it does not depend on SSH.

For additional safety, I stored a backup of the MacBook private key in Vaultwarden. If I ever need to set up a new machine, I can retrieve it from there.

---

## The Current Setup

After hardening, the SSH access model looks like this:

| Device | Key | Passphrase | Use Case |
|---|---|---|---|
| MacBook (iTerm2) | id_ed25519 | Yes (stored in keychain) | Daily server management |
| iPhone (Easy SSH) | id_ed25519_iphone | None | Occasional emergency access |

The server accepts only these two keys. No password authentication, no other access method through SSH. The Proxmox web console remains available as a fallback through a separate authentication mechanism.

---

## Why I Should Have Done This Earlier

The hardening itself took fifteen minutes. The iPhone workaround added another ten. In exchange, I got:

- **Stronger security** — Brute-force password attacks are no longer possible through SSH.
- **More convenience** — No more typing passwords. The MacBook connects instantly through the keychain-stored key.
- **Better habits** — Key-based authentication forced me to think about which devices should have access, rather than sharing a single password everywhere.

The last point is subtle but worth emphasizing. With a password, every device that knows the password has equal access. There is no way to revoke one device without changing the password for everything. With keys, each device has its own credential. If I lose the iPhone, I remove its public key from the server and nothing else changes. The MacBook continues working exactly as before.

This per-device control is something I did not fully appreciate before switching. It is not just more secure in theory. It changes how you think about access management in practice.

---

## Lessons Learned

**Security and convenience are not always trade-offs.** Key authentication with keychain integration is genuinely faster than typing a password. The common assumption that security improvements add friction is not universally true.

**Test before you cut.** Always verify key authentication works before disabling password authentication. Keep an active session open as a safety net.

**Different devices may need different keys.** The iPhone compatibility issue with encrypted ED25519 keys was unexpected. Generating a separate key per device is both a practical workaround and a better security model.

**The web console is your safety net.** Proxmox's web interface operates independently from SSH. Knowing this before making changes removes the fear of being locked out.

**Do it early.** I postponed SSH hardening for months because it felt like a low-priority task. The actual effort was minimal. If you are running a homelab with default SSH settings, this is fifteen minutes well spent.

---

## What's Next

With SSH hardened, the security layers across my homelab are now:

- **Cloudflare Tunnel** — Hides the server from the internet, no open ports.
- **Cloudflare Access** — Adds Google authentication in front of browser-only services.
- **VPN** — Restricts administrative tools to local network access.
- **SSH key authentication** — Eliminates password-based access to the host.

Each layer covers a different attack surface. None of them alone is sufficient, but together they provide a defense that is significantly stronger than what I started with: port forwarding and a password.

The homelab started with a bathroom wiring problem and now has a multi-layered security architecture. As always, each step was a response to a specific limitation I felt in the previous setup. That pattern shows no signs of stopping.
