# Room / Space — browser prototype

A dependency-free, local-first web app for building room scenes, assigning illustrative octave-band absorption values, placing and rotating furniture, and auditioning/exporting a reference response. The interface supports English and Japanese.

## Open it

Serve this folder with any static file server and open its local page. No package install, account, upload, or external service is needed. For example, from this folder run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Modern Chrome, Edge, Safari, and Firefox support the Canvas and Web Audio features used here.

## What works

- Edit room width, depth and height.
- Assign one of eight illustrative materials to each of six room planes.
- Choose living room, bedroom, kitchen, bathroom, and Japanese-room presets, then edit their furniture layouts. Switch between rectangular and approximate L-shaped plans.
- Add sofas, beds, bookcases, wardrobes, clothes racks, curtains, rugs, desks, absorber boards, diffuser panels, open/glass windows, plants, cushions, tables and cabinets; move them in plan, edit their XYZ position and box dimensions, and rotate them. Plan-view sketches help identify each object.
- Drag source and receiver in plan view or edit XYZ coordinates.
- Drag the source/microphone direction handle or the selected furniture rotation knob directly in the plan. Set azimuth and beam width with controls as well; the horizontal polar pattern changes direct and reflected image-path levels, and 360° is omnidirectional.
- Calculate shoebox image-source paths through order 8 and rectangular rigid-wall modal frequencies up to 500 Hz.
- View early reflection energy, low-frequency mode locations, and diffuse-field Sabine T60 by frequency.
- Set microphone stereo spacing; the two point receivers are calculated independently for listening and stereo RIR export.
- Enable an underwater communication demo for conversation playback. It uses water sound speed in the room response and applies a band-limited tone as a rough hydrophone/communication-device illustration.
- Generate an audible stereo preview in the browser, export its WAV RIR, and save/open scene JSON.
- Select an included Japanese or English conversation sample and play it through the current room response; the samples work offline and the impulse response remains available as a separate listening option.
- Play a conversation through separate direct and reverberant response paths; crossfade from reverb-only to direct-only, with an equal-power midpoint.
- Save four scene snapshots (A–D), compare their RT60 and source/microphone distance, and recall them later. Slots are kept in this browser.

## Model limits shown in the UI

Material values are illustrative starting points, not verified measurements. The bundled conversation samples are synthesized demo speech, not recorded dialogue. Objects use rotated box bounds and approximate intersections with paths; furnishings do not generate their own reflected paths. Absorber boards and windows replace the local wall's approximate acoustic contribution. Diffusers reduce the specular reflection but do not yet redistribute that energy into diffuse rays. An open window reduces reflection locally; it does not model outside spaces. The L-shaped plan clips the display and crudely blocks paths through its cutout, while modal frequencies still use the rectangular bounding box. Stereo uses two point receivers and has no head or ear model. The underwater communication demo changes propagation speed for the room response and applies broad band-pass filtering to the conversation playback. This filter is a deliberately simple listening cue; it is not a measured hydrophone or diver communicator response. It does not model the air-water interface, water-surface/bottom reflections, frequency-dependent water absorption, or a diver's voice production. The horizontal source/microphone beam is a smooth -6 dB beam-width approximation applied to image-source path levels; it does not alter modal coupling or diffuse tail. The image-source response uses broadband average absorption per surface and pressure loss by path length; it does not model complex impedance, air absorption, or arbitrary geometry. Modal frequencies are analytical for rigid rectangular boundaries, while modal decay uses a diffuse-field Sabine estimate. The audio preview adds a low-level seeded noise tail and conservative modal level for audibility; it is not a calibrated full physical RIR. Use exported IRs as experimental previews and compare against measured room responses before relying on them for physical prediction.

The app does not infer geometry or materials from photographs or floor plans.
