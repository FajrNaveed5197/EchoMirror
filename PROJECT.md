# Echo Mirror — Creative Design project

## Concept

Echo Mirror turns self-observation into a visible interaction. A conventional mirror reflects continuously; this mirror responds to the participant’s attention. A brief look feels familiar, a prolonged look fades, closeness fragments the image, and returning leaves traces of previous reflections.

The central design question is: **How does our relationship with our reflection change when the mirror refuses to remain passive?**

This is an exploratory artwork, not a claim that looking at oneself is harmful. Participants may interpret the same response as playful, frustrating, calming, or unsettling.

## Design intention

The interaction makes an ordinarily invisible behaviour—time spent facing a reflection—tangible. The fading image creates tension between the desire to see more and the diminishing visibility of the self. Fragmentation challenges the impulse to move closer for detail. Ghost traces suggest that repeated checks accumulate, even when each check feels momentary.

A minimal interface gives the reflection visual priority. A pale background, quiet typography, restrained green accents, and a softly arched mirror frame support a calm experience. Live measurements sit beside the mirror so the behaviour is explainable during a course demonstration. Fullscreen helps present the work as an installation.

## Participant journey

1. Read the brief introduction and choose to enable the webcam.
2. Face the mirror at a comfortable distance while it calibrates.
3. Look briefly and see a clear reflection.
4. Stay facing the mirror and notice the gradual disappearance.
5. Look away to restore the reflection; return and notice a lingering echo.
6. Move closer and see fragmentation; step back to restore coherence.
7. End the session and see estimated looking time, longest look, and returns.
8. Reflect on the experience; optionally download numerical session data.

## Input → interpretation → output

| Input | Prototype interpretation | Output |
|---|---|---|
| Face landmarks | Face present and approximately frontal | Estimated attention timer advances |
| Continuous frontal presence | More than the selected fade delay | Reflection gradually fades |
| Increased face width | Closer than calibrated starting position | Reflection splits into displaced tiles |
| Look away, then return | Separate visits after a grace period and minimum dwell | Previous visit appears as a fading ghost |
| End session | Participant finishes voluntarily | Numerical summary and reflection prompts |

Default values are six seconds before fading, twelve seconds for the fade, 1.2 seconds away to separate visits, 0.6 seconds to confirm a return, and 1.35× relative face width before fragmentation. These are initial artistic choices to test, rather than scientifically established thresholds.

## Prototype implementation

The browser displays a horizontally mirrored webcam frame using Canvas 2D. Google MediaPipe Face Landmarker supplies face geometry. Approximate head orientation determines whether the participant appears to face the screen. A median of twenty frontal samples calibrates starting face width. An independent interaction engine keeps timers, return counts, fade level, and fragmentation strength.

Ghost images are temporary low-resolution canvas snapshots of the previous visit. They are shifted slightly and fade over 45 active seconds. The app limits them to four and clears them when a session ends. A separate illustrated demo allows the interaction to be explained without granting camera access; demo data is labeled simulated.

## Privacy and participation

The webcam begins only after an explicit button press and browser permission. The prototype processes frames locally and does not upload or record images. It releases the camera at the end. Participants can use the demo instead. Library/model/font downloads require internet access. The optional export contains numerical metrics, not images.

For a class study, explain the experience before starting, allow participants to stop freely, and request permission before collecting their exported numbers or feedback. Do not infer personal traits or mental health from the results.

## Demonstration script (about 90 seconds)

- **0–15s:** Introduce the idea: “This mirror changes in response to how long and how often we look at ourselves.” Begin the webcam and calibrate.
- **15–35s:** Face the mirror continuously. Explain that the image fades as estimated looking time increases.
- **35–50s:** Turn away for two seconds, then return. Show the previous reflection as an echo. Repeat if useful.
- **50–65s:** Move closer to trigger fragmentation, then step back.
- **65–90s:** End the session, discuss the estimated duration, and ask: “Did disappearing make you want to look more, or less?”

Use the illustrated demo if the presentation environment cannot access the camera or download the model. Keep its simulated status visible.

## Evaluation plan

Run short voluntary sessions with 3–5 classmates. Have each person perform a brief look, a prolonged look, a closer look, and two deliberate returns. Recalibrate between participants. Observe whether each response occurs, whether the effect is understandable, and whether the interface interferes with the reflection.

Ask:

1. When did you first notice the mirror responding?
2. What did you think made the image fade or fragment?
3. Did ghost traces communicate repetition?
4. How did you feel when the reflection disappeared?
5. What would make the interaction clearer?

Record observations and voluntary comments without collecting images. Compare the app’s estimated looking duration with an observer’s rough timing to identify obvious failures; this does not validate precise gaze measurement.

| Participant | Effects triggered as intended? | Response understood? | Voluntary comment | Change to consider |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

This is an evaluation plan; no participant results have been collected or invented.

## Limitations and next steps

Head orientation is a proxy for attention. A participant can face the screen without looking at their reflection. Detection also depends on lighting, occlusion, camera position, and the device. Relative face size estimates closeness; it does not measure distance in centimetres. This prototype supports one participant at a time, with no identity recognition between visits.

After classroom testing, tune the effect thresholds and improve calibration feedback. For a physical installation, investigate a screen behind a two-way mirror and align the camera with the reflection. Stronger gaze measurement would require a separate calibrated eye-tracking design. Moving detection to a web worker could improve performance on slower laptops.

## Technical reference

[Google MediaPipe Face Landmarker for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js).
