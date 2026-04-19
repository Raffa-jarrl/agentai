# Ariel Streets — Hebrew TTS Pronunciation Dictionary

A pronunciation dataset for Hebrew street names in the city of Ariel, designed to improve Hebrew TTS output (especially via ElevenLabs / Vapi).

## Why this exists

Modern Hebrew is written without diacritics (niqqud), so TTS models have to guess the pronunciation of street names. This gets especially unreliable for biblical names, military operations, and proper nouns. This dictionary provides each street name in four forms:

1. **Undiacritized** — how the text normally appears (matches what your LLM will produce)
2. **Diacritized** — with niqqud, for TTS models that use diacritics (Roboshaul, HebTTS, etc.)
3. **IPA** — phonetic transcription for ElevenLabs' Pronunciation Dictionary
4. **Category** — thematic group (flowers, trees, biblical places, etc.)

## Files

| File | Purpose |
|------|---------|
| `ariel_streets.json` | Master file; everything in one place. Use this as your source of truth. |
| `ariel_streets.csv` | Editable spreadsheet. Open in Excel/Numbers to review and correct. |
| `ariel_streets_ipa.pls` | Ready-to-upload ElevenLabs Pronunciation Dictionary with IPA. |
| `ariel_streets_alias.pls` | Alternative: maps undiacritized → diacritized Hebrew (use if your TTS handles niqqud natively). |

## How to use with ElevenLabs + Vapi

1. Go to ElevenLabs dashboard → Voices → Pronunciation Dictionaries → Create new
2. Upload `ariel_streets_ipa.pls`
3. Copy the dictionary ID
4. In your Vapi assistant config, attach the dictionary ID to your voice configuration:

```json
{
  "voice": {
    "provider": "11labs",
    "voiceId": "your-voice-id",
    "pronunciationDictionaryLocators": [
      {
        "pronunciationDictionaryId": "your-dict-id-from-elevenlabs",
        "versionId": "latest"
      }
    ]
  }
}
```

## Known limitations — READ THIS

**This file is a starting point, not a finished product.** Specifically:

1. **Not the complete official list.** The official street count in Ariel (per the Population Authority, 2012) is **117 streets**. This file contains fewer because I compiled it from public web sources (ad.co.il, lamakama.co.il, b144, various bus-route data), not from Ariel municipality's GIS. To get the full list, contact Ariel municipality at 03-9061666 and ask for the GIS/CSV of city streets.

2. **No quarter (רובע) assignments.** The user initially asked for streets grouped by רובע א/ב/ג/ד, but Ariel does not actually use that quartering scheme (that's an Ashdod/Be'er Sheva convention). Ariel is organized by named neighborhoods (מוריה, הסביונים, עיר היונה, גנים, רמת הגולן, נווה שאנן, אמירים, etc.). Per-street neighborhood assignment was not reliably available in public sources, so it was left out.

3. **Niqqud is best-effort, not verified.** Entries marked `"confidence": "high"` are common words unlikely to be wrong. Entries marked `"medium"` or `"low"` should be verified. The safest pipeline is:
   - Take `ariel_streets.csv`
   - Run the `undiacritized` column through [Dicta Nakdan API](https://nakdan.dicta.org.il/)
   - Compare Dicta's output to the `diacritized` column here
   - Have a native Hebrew speaker review disagreements

4. **IPA is Modern Israeli Hebrew.** Not Sephardic, not Ashkenazi, not biblical. If your TTS voice leans one way, you may need to adjust.

## IPA conventions used

| IPA | Hebrew | Example |
|-----|--------|---------|
| `ʁ` | ר (uvular, French-style) | `jifˈtaχ` for יפתח |
| `χ` | ח, כ (no dagesh) | `χev.ˈʁon` for חברון |
| `ʃ` | שׁ | `ha.ʃaˈked` for השקד |
| `ts` | צ | `tsiˈjon` for ציון |
| `j` | י (consonant) | `jasˈmin` for יסמין |
| `ˈ` | (before stressed syllable) | `ha.ˈe.ʁez` for הארז |
| `.` | syllable boundary | — |

## Next steps to make this production-grade

1. Contact Ariel municipality GIS department for the full 117-street list with neighborhood tagging.
2. Re-run the undiacritized list through Dicta Nakdan API and spot-check against this file.
3. Do a QA call with ElevenLabs reading each name back to you; flag any that still sound wrong and correct the IPA.
4. Add common misspellings and variants (e.g. "האצ״ל" vs "האצל") as additional lexemes.
