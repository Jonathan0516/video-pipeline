# API Facts

Last reviewed: 2026-07-30

Use this file as a compact factual baseline. Verify exact request fields, model availability, regional endpoints, limits, and pricing against official provider documentation before production or paid calls.

## MiniMax Official Speech API

Use MiniMax directly, not a NetMind proxy.

Official documentation:

- Synchronous TTS: https://platform.minimaxi.com/docs/api-reference/speech-t2a-http
- File upload: https://platform.minimaxi.com/docs/api-reference/file-management-upload
- Voice cloning: https://platform.minimaxi.com/docs/api-reference/voice-cloning-clone
- Voice list: https://platform.minimaxi.com/docs/api-reference/voice-management-get

### Authentication and endpoints

- API key environment variable: `MINIMAX_API_KEY`
- Optional base URL environment variable: `MINIMAX_API_BASE_URL`
- Default official base URL: `https://api.minimaxi.com`
- Synchronous TTS: `POST /v1/t2a_v2`
- File upload: `POST /v1/files/upload`
- Voice cloning: `POST /v1/voice_clone`
- Header: `Authorization: Bearer ${MINIMAX_API_KEY}`
- JSON requests use `Content-Type: application/json`; file uploads use multipart form data.

Use the endpoint region associated with the user's MiniMax account and API key. Do not silently send a key to a different region or third-party proxy.

### Speech 2.8 synchronous TTS

Default model: `speech-2.8-hd`.

```json
{
  "model": "speech-2.8-hd",
  "text": "Hello from MiniMax.",
  "stream": false,
  "language_boost": "auto",
  "voice_setting": {
    "voice_id": "male-qn-qingse",
    "speed": 1,
    "vol": 1,
    "pitch": 0
  },
  "audio_setting": {
    "sample_rate": 32000,
    "bitrate": 128000,
    "format": "mp3",
    "channel": 1
  },
  "subtitle_enable": false
}
```

For a successful non-streaming response:

- Require HTTP success.
- Require `base_resp.status_code == 0`.
- Require `data.status == 2` before accepting the audio as complete.
- Decode the hexadecimal string in `data.audio` to the requested binary format.
- Record `trace_id`, model, voice ID, output path, and audio metadata in `work/job-state.json`.
- Never record the API key, Authorization header, or signed download URL.

The official response also includes `extra_info` such as audio length, sample rate, size, bitrate, format, channel count, and billed character usage. These are safe to retain when useful.

### Official voice cloning

1. Upload the authorized source audio to `POST /v1/files/upload` using multipart field `purpose=voice_clone`.
2. Record the returned `file.file_id`.
3. Choose a unique custom `voice_id` that follows the official naming rules.
4. Call `POST /v1/voice_clone` with `file_id` and `voice_id`.
5. Optionally provide `text` and `model: speech-2.8-hd` to create a billed preview.
6. Use the cloned `voice_id` in a formal TTS request. The official documentation warns that a cloned voice may be removed if it is not used for formal synthesis within seven days.

Clone source requirements documented by MiniMax:

- MP3, M4A, or WAV.
- 10 seconds to 5 minutes.
- At most 20 MB.
- Prefer a clean single speaker with little music or reverberation.

Optional `clone_prompt` uses a separately uploaded `prompt_audio` file and matching `prompt_text`; the prompt audio must be under 8 seconds and at most 20 MB.

### Production behavior

- Prefer natural speaking speed for HeyGen mouth tracking, generally near `1.0`.
- Generate the full narration once, then trim its first 15 seconds for the preview gate.
- Save full narration as `work/voiceover-full.mp3` and the preview as `work/preview-15s.mp3`.
- Reuse a saved custom `voice_id` only when the authorized source hash and MiniMax account match.
- Treat error codes, empty audio, incomplete status, and invalid hex as failed synthesis.

## HeyGen Image-to-Video and Assets

Official documentation:

- https://developers.heygen.com/image-to-video
- https://developers.heygen.com/assets
- https://developers.heygen.com/docs/pricing

Workflow facts used by this skill:

- Upload the portrait and MiniMax narration through the HeyGen Assets API.
- Use `audio_asset_id` when driving the avatar with MiniMax audio.
- Do not use HeyGen `script + voice_id` unless the user explicitly changes strategy.
- Poll video jobs by `video_id`; a timeout is not a failed job.
- Generate and decode-check a 15-second preview before the full video unless the user explicitly waives the gate.
- Download completed videos promptly enough to avoid expired temporary URLs.

## Pricing and availability

- Do not hard-code prices in automation.
- Before large batches, ask the user to confirm current MiniMax and HeyGen pricing, account limits, and quota.
- Treat MiniMax and HeyGen generation as paid or potentially billable external actions unless the user says otherwise.
