import React, {useRef, useEffect} from 'react'
import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import Webcam from 'react-webcam';

import '../styles/App.css';

const state = {
    video: null,
    stream: null,
    net: null,
    videoConstraints: {},
    // Triggers the TensorFlow model to reload
    changingArchitecture: false,
    changingMultiplier: false,
    changingStride: false,
    changingResolution: false,
    changingQuantBytes: false,
  };

  async function loadBodyPix() {
    // toggleLoadingUI(true);
    state.net = await bodyPix.load({
        architecture: 'MobileNetV1', outputStride: 16, multiplier: 0.75, quantBytes: 2
    });
    // toggleLoadingUI(false);
  }

  async function setupCamera(){
    const video = document.querySelector("#webcam");
    navigator.mediaDevices
            .getUserMedia({video: true})
            .then((stream) => {
                video.srcObject = stream;
            });

            return new Promise((resolve) => {
                video.onloadedmetadata = () => {
                  video.width = video.videoWidth;
                  video.height = video.videoHeight;
                  resolve(video);
                };
              });
  }

  async function loadVideo() {
    try {
        state.video = await setupCamera();
      } catch (e) {
        let info = document.getElementById('info');
        info.textContent = 'this browser does not support video capture,' +
            'or this device does not have a camera';
        info.style.display = 'block';
        throw e;
      }

      state.video.play();
  }

  function segmentBodyInRealTime(){
      const canvas = document.getElementById('gesture-canvas');

      async function bodySegmentationFrame(){
        if (state.changingArchitecture || state.changingMultiplier ||
            state.changingCamera || state.changingStride ||
            state.changingQuantBytes) {
          console.log('load model...');
          loadBodyPix();
          state.changingArchitecture = false;
          state.changingMultiplier = false;
          state.changingStride = false;
          state.changingQuantBytes = false;
        }

        const multiPersonSegmentation = await state.net.segmentMultiPerson(state.video,{
            flipHorizontal: false,
            internalResolution: 'low',
            segmentationThreshold: 0.4,
            maxDetections: 10,
            scoreThreshold: 0.3,
            nmsRadius: 20,
            numKeypointForMatching:17,
            refineSteps: 10
          });

        //   console.log(multiPersonSegmentation);
    
          const foregroundColor = {r: 255, g: 255, b: 255, a: 255};
          const backgroundColor = {r: 0, g: 0, b: 0, a: 200};
          const mask = bodyPix.toMask(
                    multiPersonSegmentation, foregroundColor, backgroundColor,
                    true);
    
                bodyPix.drawMask(
                    canvas, state.video, mask, 0.98,
                    8, false);

        requestAnimationFrame(bodySegmentationFrame);

      }
      bodySegmentationFrame();

      
  }

  async function bindPage(){
      await loadBodyPix();
      document.getElementById('loading').style.display = 'none';
      document.getElementById('webcam-container').style.display = 'inline-block';

      await loadVideo();

      segmentBodyInRealTime();
      
  }

  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  export default function Eye(){
      bindPage();
    return (
        <div>
            <p id="loading">loading the model</p>
            <p id="info">...</p>

            <div id="webcam-container">
                {/* {camState === 'on' ?
                <Webcam id="webcam" ref={webcamRef}/>
            : <div id="webcam" background="black"></div>
            } */}

                <video id="webcam" autoPlay></video>
                <canvas id="gesture-canvas" style={{}}/>
            </div>
            {/* <canvas id="gesture-canvas" ref={canvasRef} style={{}}/> */}
            
            
        </div>
    )
  }


// export default function Eye() {

//     const webcamRef = useRef(null);
//     const canvasRef = useRef(null);

//     navigator
//         .mediaDevices
//         .getUserMedia({video: true})
//         .then((stream) => {
//             const video = document.querySelector("#webcam");

//             video.srcObject = stream;
//             video.addEventListener("loadeddata", () => {

//                 bodyPix
//                     .load({architecture: 'MobileNetV1', outputStride: 16, multiplier: 0.50, quantBytes: 2})
//                     .then(net => {
//                         detectBody(video, net);
//                     })
//             })
//         });


//     function detectBody(webcam, net) {

//         const vid = webcam;
//         const videoWidth = webcam.videoWidth;
//         const videoHeight = webcam.videoHeight;

//         // Set video width
//         vid.width = videoWidth;
//         vid.height = videoHeight;

//         // Set canvas height and width
//         canvasRef.current.width = videoWidth;
//         canvasRef.current.height = videoHeight;

//         const canvas = canvasRef.current;

//         net
//             .segmentPerson(vid)
//             .then(segmentation => {
//                 console.log(segmentation);

//                 // The mask image is an binary mask image with a 1 where there is a person and a
//                 // 0 where there is not.
//                 const coloredPartImage = bodyPix.toMask(segmentation);
//                 const opacity = 0.7;
//                 const flipHorizontal = false;
//                 const maskBlurAmount = 0;
//                 const canvas = document.getElementById('gesture-canvas');
//                 // Draw the mask image on top of the original image onto a canvas. The colored
//                 // part image will be drawn semi-transparent, with an opacity of 0.7, allowing
//                 // for the original image to be visible under.
//                 bodyPix.drawMask(canvas, vid, coloredPartImage, opacity, maskBlurAmount, flipHorizontal);
//             })

//         // Make Detections const segmentation = await net.segmentPerson(video);

//         setTimeout(function() {
//             requestAnimationFrame(() => detectBody(vid, net));
//             // Drawing code goes here
//         }, 1000 / 30);
//         // requestAnimationFrame(() => detectBody(vid, net));

//     }

//     async function runBodysegment() {
//         const net = await bodyPix.load({architecture: 'MobileNetV1', outputStride: 16, multiplier: 0.75, quantBytes: 2});

//         // requestAnimationFrame(() => detect(net)); detect(net);
//         // segmentBodyinRealTime(); setInterval(() => {     detect(net); }, 100);
//     };

//     function segmentBodyinRealTime() {
//         const canvas = document.getElementById('gesture-canvas');

//         async function bodySegmentationFrame() {
//             const net = await bodyPix.load({architecture: 'MobileNetV1', outputStride: 16, multiplier: 0.75, quantBytes: 2});

//             if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null && webcamRef.current.video.readyState === 4) {
//                 // Get Video Properties
//                 const video = webcamRef.current.video;
//                 const videoWidth = webcamRef.current.video.videoWidth;
//                 const videoHeight = webcamRef.current.video.videoHeight;

//                 // Set video width
//                 webcamRef.current.video.width = videoWidth;
//                 webcamRef.current.video.height = videoHeight;

//                 // Set canvas height and width
//                 canvasRef.current.width = videoWidth;
//                 canvasRef.current.height = videoHeight;

//                 // Make Detections
//                 const segementation = await net.segmentMultiPerson(video, {
//                     flipHorizontal: false,
//                     internalResolution: 'medium',
//                     segmentationThreshold: 0.7,
//                     maxDetections: 10,
//                     scoreThreshold: 0.2,
//                     nmsRadius: 20,
//                     minKeypointScore: 0.3,
//                     refineSteps: 10
//                 });
//                 console.log(segementation);

//                 const coloredPartHuman = bodyPix.toColoredPartMask(segementation);
//                 const opacity = 0.7;
//                 const flipHorizontal = false;
//                 const maskBlurAmount = 0;

//                 //   const canvas = canvasRef.current;
//                 console.log('kudune gambar');
//                 bodyPix.drawMask(canvas, video, coloredPartHuman, opacity, maskBlurAmount, flipHorizontal)

//             }

//             requestAnimationFrame(bodySegmentationFrame);

//         }
//         bodySegmentationFrame();
//     }

//     async function detect(net) {

//         console.log('masuk detect');
//         // Check data is available
//         if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null && webcamRef.current.video.readyState === 4) {
//             // Get Video Properties
//             const video = webcamRef.current.video;
//             const videoWidth = webcamRef.current.video.videoWidth;
//             const videoHeight = webcamRef.current.video.videoHeight;

//             // Set video width
//             webcamRef.current.video.width = videoWidth;
//             webcamRef.current.video.height = videoHeight;

//             // Set canvas height and width
//             canvasRef.current.width = videoWidth;
//             canvasRef.current.height = videoHeight;

//             // Make Detections
//             const segementation = await net.segmentMultiPerson(video, {
//                 flipHorizontal: false,
//                 internalResolution: 'medium',
//                 segmentationThreshold: 0.7,
//                 maxDetections: 10,
//                 scoreThreshold: 0.2,
//                 nmsRadius: 20,
//                 minKeypointScore: 0.3,
//                 refineSteps: 10
//             });
//             console.log(segementation);

//             //             const maskBackground = true; // Convert the segmentation into a
//             // mask to darken the background. const foregroundColor = {r: 0, g: 0, b: 0, a:
//             // 0}; const backgroundColor = {r: 0, g: 0, b: 0, a: 255}; const
//             // backgroundDarkeningMask = bodyPix.toMask(     segementation, foregroundColor,
//             // backgroundColor);     const opacity = 0.7; const maskBlurAmount = 3; const
//             // flipHorizontal = false; // const canvas =
//             // document.getElementById('gesture-canvas'); // Draw the mask onto the image on
//             // a canvas.  With opacity set to 0.7 and // maskBlurAmount set to 3, this will
//             // darken the background and blur the // darkened background's edge.
//             // bodyPix.drawMask(     canvas, video, backgroundDarkeningMask, opacity,
//             // maskBlurAmount, flipHorizontal);         //draw detection
//             const coloredPartHuman = bodyPix.toColoredPartMask(segementation);
//             const opacity = 0.7;
//             const flipHorizontal = false;
//             const maskBlurAmount = 0;

//             const canvas = canvasRef.current;
//             console.log('kudune gambar');
//             bodyPix.drawMask(canvas, video, coloredPartHuman, opacity, maskBlurAmount, flipHorizontal)

//             requestAnimationFrame(() => detect(net));

//         }

//         // setTimeout(function() {     requestAnimationFrame(()=> detect(net));     //
//         // Drawing code goes here }, 1000)
//         detect(net);
//     }

//     // runBodysegment(); segmentBodyinRealTime(); useEffect(() => {
//     // runBodysegment(); }, []);

//     return (
//         <div>
//             <div id="webcam-container">
//                 {/* {camState === 'on' ?
//                 <Webcam id="webcam" ref={webcamRef}/>
//             : <div id="webcam" background="black"></div>
//             } */}

//                 <video id="webcam" autoPlay></video>
//                 <button id="enable-webcam">enable</button>

//             </div>
//             {/* <canvas id="gesture-canvas" ref={canvasRef} style={{}}/> */}
//             <canvas id="gesture-canvas" ref={canvasRef} style={{}}/>

//         </div>
//     )
// }
