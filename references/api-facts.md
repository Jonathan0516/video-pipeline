# API Facts

Last reviewed: 2026-07-30

Use this file as a compact factual baseline. If a task depends on exact request fields, pricing, model availability, or provider limits, verify against official NetMind and HeyGen documentation before coding or running paid requests.

## NetMind Speech (MiniMax model via NetMind)

Provider: **NetMind** (not direct MiniMax platform).

Auth and endpoint:

- Environment variable: `NETMIND_API_KEY`
- Base generation URL: `https://api.netmind.ai/v1/generation`
- Header: `Authorization: Bearer ${NETMIND_API_KEY}`
- Header: `Content-Type: application/json`

Default TTS model on NetMind:

- `minimax/speech-02-hd`

Example request shape (from NetMind generation API):

```bash
export API_KEY="<YOUR API Key>"
curl -X POST 'https://api.netmind.ai/v1/generation' \
  --header "Authorization: Bearer ${API_KEY}" \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "model": "minimax/speech-02-hd",
    "config": {
        "text": "Hello world! This is a test of the text-to-speech system.",
        "voice_setting": {
          "speed": 1,
          "vol": 1,
          "voice_id": "Wise_Woman",
          "pitch": 0,
          "english_normalization": false
        },
        "output_format": "hex"
    }
}'
```

Workflow facts used by this skill:

- Call NetMind `POST /v1/generation` for text-to-speech.
- Put narration text in `config.text`.
- Put speaker settings in `config.voice_setting` (`voice_id`, `speed`, `vol`, `pitch`, `english_normalization`).
- Prefer `output_format: "hex"`. Decode the returned hex audio payload to a binary audio file (usually MP3/WAV depending on provider payload).
- Reuse a stable `voice_id` per speaker when reuse is intended (preset system voice or an authorized custom/cloned voice id the user already has).
- Source voice samples (for clone or voice design workflows outside pure TTS) should still be clean: single speaker, little music/reverb, stable volume.
- Do not store API keys, Authorization headers, or temporary download URLs in state files.

Recommended production behavior:

- Generate a short test clip before long narration.
- Prefer natural speaking speed for HeyGen mouth tracking (often `speed` around `0.95`–`1.05` if Chinese lip sync looks strained).
- Save full narration as `work/voiceover-full.mp3`.
- Save the first 15 seconds as `work/preview-15s.mp3` for the HeyGen preview gate.
- Never print full keys or full Authorization headers.

## HeyGen Image-to-Video and Assets

Official docs:

- https://developers.heygen.com/image-to-video
- https://developers.heygen.com/assets
- https://developers.heygen.com/docs/pricing

Workflow facts used by this skill:

- Assets can be uploaded through the HeyGen Assets API.
- Image-to-Video can be driven by an uploaded image asset and a custom uploaded audio asset.
- Use `audio_asset_id` when the narration is generated outside HeyGen (this skill uses NetMind audio).
- Do not use HeyGen `script + voice_id` when the intended voice is NetMind narration, unless the user explicitly changes strategy.
- Normal asset uploads have a size limit; large files may need a direct-upload or provider-specific large-file flow.
- Video jobs should be polled by `video_id`; a timeout is not the same as a failed job.

Recommended production behavior:

- Generate a 15-second preview first, usually at lower resolution.
- Generate full 1080p only after explicit preview approval.
- Download finished videos immediately enough to avoid expired links.
- Decode-check the full MP4 after download; do not rely only on file size or the first few seconds.

## Pricing And Availability

- Do not hard-code historical prices in automation.
- Before large batches, ask the user to confirm current NetMind and HeyGen pricing, account limits, and quota.
- Treat network calls to NetMind or HeyGen as paid or potentially billable external actions unless the user says otherwise.
