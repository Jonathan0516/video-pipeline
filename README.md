# avatar-video-skill

Public-safe **NetMind (MiniMax model) TTS + HeyGen** workflow for producing
authorized 数字人 / 口播 (digital-human / talking-head) videos from a script and
portrait, with a mandatory 15-second preview gate before full generation.

面向已获授权的语音、肖像、脚本与发布流程，用于从脚本和肖像生成数字人口播视频；
全量生成前强制先出 15 秒预览。

This is a workflow skill, not a hosted service. Bring your own accounts,
billing, permissions, and rights to the source materials.

---

## Install / 安装

The skill directory **must be named `avatar-video-skill`** so it matches the
`name:` in `SKILL.md`. Rename on copy if your repo folder differs.
安装目录**必须叫 `avatar-video-skill`**（与 `SKILL.md` 的 `name` 一致），复制时按需重命名。

### Claude Code

```bash
cp -R rachel-digital-human-production ~/.claude/skills/avatar-video-skill
```

Then invoke explicitly in a new task / 在新任务中显式调用：

```text
Use /avatar-video-skill to make a 15-second digital-human preview first.
```

### Codex

```bash
cp -R rachel-digital-human-production ~/.codex/skills/avatar-video-skill
```

Then invoke explicitly / 显式调用：

```text
Use $avatar-video-skill to make a 15-second digital-human preview first.
```

Explicit invocation is required so paid production workflows do not trigger
accidentally. 需显式调用，避免意外触发付费生产流程。

---

## Environment Variables / 环境变量

Provide your own accounts, billing, and API keys / 自行提供账户、账单与 API 密钥：

```bash
export NETMIND_API_KEY="..."   # NetMind (MiniMax speech model)
export HEYGEN_API_KEY="..."    # HeyGen Image-to-Video / Photo Avatar
```

> NetMind now covers what earlier setups called `MINIMAX_API_KEY`. Use
> `NETMIND_API_KEY` — the skill reads only this variable for speech.
> NetMind 已兼容旧的 `MINIMAX_API_KEY`；语音只读 `NETMIND_API_KEY` 这一个变量。

Do not commit `.env` files or real keys. 不要提交 `.env` 文件或真实密钥。

---

## Expected Project Layout / 预期项目布局

```text
project/
├── inputs/
│   ├── portrait.jpg
│   ├── voice-source.mp3
│   └── script.md
├── work/
│   ├── voiceover-full.mp3
│   ├── preview-15s.mp3
│   └── job-state.json
└── outputs/
    ├── preview-15s.mp4
    └── final-1080p.mp4
```

---

## Helper Scripts / 辅助脚本

Create a starter state file / 创建初始状态文件：

```bash
scripts/init_job_state.py --project demo --out work/job-state.json
```

Preflight assets before any paid API call / 付费调用前预检资源：

```bash
scripts/preflight_assets.py \
  --script inputs/script.md \
  --portrait inputs/portrait.jpg \
  --voice inputs/voice-source.mp3
```

---

## Safety / 安全

Use only for authorized voice, portrait, script, and publishing workflows.
Installing the skill does not grant access to NetMind, HeyGen, OpenAI, paid
credits, network access, legal clearance, or the author's files.

仅用于已授权的语音、肖像、脚本与发布流程。安装本技能不授予对 NetMind、HeyGen、
OpenAI 的访问权限，也不提供付费额度、网络访问、法律许可或作者的文件。
