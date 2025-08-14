// <!--    <div id="scale-indicator"></div>-->


// event


// const container = ui.DivPdfContainer;
//
// let pendingDelta = 0;
// let lastPos = { x: 0, y: 0 };
// let wheelRAF = null;
//
// container.addEventListener('wheel', (e) => {
//     e.preventDefault();
//     pendingDelta += e.deltaY;
//     lastPos.x = e.clientX;
//     lastPos.y = e.clientY;
//
//     if (wheelRAF) return;
//     wheelRAF = requestAnimationFrame(async () => {
//         const dy = pendingDelta;
//         const { x, y } = lastPos;
//         pendingDelta = 0;
//         wheelRAF = null;
//
//         // single call that does cursor-centered zoom
//         await actions.zoomAt(x, y, dy);
//     });
// }, { passive: false });


// action.js
// export async function zoomAt(clientX, clientY, deltaY) {
//     const rect = DivPdfContainer.getBoundingClientRect();
//
//     // cursor position relative to container (overlay coords)
//     const p = { x: clientX - rect.left, y: clientY - rect.top };
//
//     // convert delta to discrete steps (trackpads can be large)
//     const sign = deltaY < 0 ? 1 : -1;
//     const magnitude = Math.abs(deltaY);
//
//     // Tune these to taste:
//     // - baseSteps: at least 1 step
//     // - extraSteps kick in for large deltas so big scrolls feel proportional
//     const baseSteps = 1;
//     const extraSteps = Math.min(4, Math.floor(magnitude / 120)); // 0..4 extra
//     const totalSteps = baseSteps + extraSteps;
//
//     for (let i = 0; i < totalSteps; i++) {
//         const oldScale = currentScale;
//         const next = Math.max(ZOOM.min, Math.min(ZOOM.max, oldScale + sign * ZOOM.step));
//         if (next === oldScale) break;
//
//         const k = next / oldScale;
//
//         // keep cursor-anchored point stable: pan' = (1 - k) * p + k * pan
//         const newPanX = (1 - k) * p.x + k * panOffset.x;
//         const newPanY = (1 - k) * p.y + k * panOffset.y;
//
//         setPanOffset(newPanX, newPanY);
//         setCurrentScale(next);
//         recomputePxPerMeter();
//
//         // If you added render-cancellation in canvas.js, awaiting is safe & flicker-free
//         await renderAtCurrentTransform();
//     }
// }

//
// export function handleMeasureMode() {
//
//     handleClearClick();
//     measureCanvas.style.pointerEvents = 'auto';
//     document.getElementById('info').innerText = 'Click two points to measure.';
//
// }



