import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useThree, useLoader, useFrame } from "@react-three/fiber";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader";

import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import HdriEnvironment from "./HdriEnvironement";
import gsap from "gsap";

function CameraControls({ cameraPosition }) {
  const {
    camera,
    gl: { domElement },
  } = useThree();

  const controls = useRef();
  useFrame((state) => controls.current.update());

  useEffect(() => {
    if (cameraPosition) {
      camera.position.x = cameraPosition[0];
      camera.position.y = cameraPosition[1];
      camera.position.z = cameraPosition[2];
    }
  }, [cameraPosition, camera]);

  return <OrbitControls ref={controls} args={[camera, domElement]} />;
}

function Model({ url, setModelScreenshot }) {
  const { scene, gl, camera } = useThree();
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    const dracoLoader = new DRACOLoader();

    dracoLoader.setDecoderPath("./draco/"); // Spécifiez le chemin du décodeur DRACO
    loader.setDRACOLoader(dracoLoader);
  });

  const modelRef = useRef();

  useEffect(() => {
    while (scene.children.length) {
      scene.remove(scene.children[0]);
    }

    modelRef.current = gltf.scene;
    scene.add(modelRef.current);

    return () => {
      scene.remove(modelRef.current);
    };
  }, [gltf, scene]);

  useFrame(() => {
    if (modelRef.current) {
      gl.render(scene, camera);
      const screenshotDataUrl = gl.domElement.toDataURL("image/png");
      setModelScreenshot(screenshotDataUrl);
    }
  });

  return null;
}

function formatSize(size) {
  const sizeKb = size / 1024;
  const sizeMb = sizeKb / 1024;
  return `${sizeMb.toFixed(2)} MB`;
}

function App() {
  const [cameraPosition, setCameraPosition] = useState(null);

  const moveCamera = (position) => {
    setCameraPosition(position);
  };
  console.log(cameraPosition);
  const cameraRef = useRef(); // Créez une référence à la caméra

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.x = cameraPosition.x;
      cameraRef.current.position.y = cameraPosition.y;
      cameraRef.current.position.z = cameraPosition.z;
    }
  }, [cameraPosition]);
  const [models, setModels] = useState([]);
  const [selectedModelIndex, setSelectedModelIndex] = useState(null);
  const [fileSelected, setFileSelected] = useState(false);
  const containerCanvas = useRef(null);
  const headerContainer = useRef(null);
  const [hdriUrl, setHdriUrl] = useState(null);

  const onFileChange = (event) => {
    if (event.target.files.length) {
      const newModels = Array.from(event.target.files).map((file) => ({
        url: URL.createObjectURL(file),
        screenshot: null,
        name: file.name,
        size: file.size,
      }));
      setModels((current) => [...current, ...newModels]);
      setSelectedModelIndex(newModels.length - 1);
      setFileSelected(true);
    }
  };

  const downloadScreenshot = (screenshot) => {
    const link = document.createElement("a");
    link.href = screenshot;
    link.download = "screenshot.png";
    link.click();
  };

  console.log(headerContainer.current?.clientHeight);
  const selectModel = (index) => {
    setSelectedModelIndex(index);
  };
  const handleHdrInputChange = (event) => {
    if (event.target.files.length) {
      const file = event.target.files[0];
      const url = URL.createObjectURL(file);
      setHdriUrl(url); // where setHdriUrl is a function from useState
    }
  };

  return (
    <div>
      <header ref={headerContainer}>
        <img src="logo.svg" alt="" />
        <h1>GLB PREVIEW</h1>
      </header>
      <div
        className="appContainer"
        style={{
          height: `calc(100vh - 4em - ${headerContainer.current?.clientHeight}px )`,
        }}>
        {!fileSelected && (
          <div className="fileInputContainer">
            <input
              type="file"
              id="file"
              className="fileInput"
              onChange={onFileChange}
              multiple
              accept=".glb"
            />
            <label htmlFor="file">
              <img src="upload.svg" alt="" />
              Choisissez des fichiers ou faites glisser ici
            </label>
          </div>
        )}
        {fileSelected && (
          <React.Fragment>
            <div
              ref={containerCanvas}
              style={{
                width: "50%",
                height: containerCanvas.current?.clientWidth + "px",
              }}>
              <Canvas>
                <CameraControls cameraPosition={cameraPosition} />
                <Suspense fallback={null}>
                  {hdriUrl ? (
                    <HdriEnvironment hdriUrl={hdriUrl} />
                  ) : (
                    <Environment preset="city" />
                  )}

                  {selectedModelIndex !== null && (
                    <Model
                      url={models[selectedModelIndex].url}
                      setModelScreenshot={(screenshot) =>
                        setModels((current) =>
                          current.map((m, i) =>
                            i === selectedModelIndex ? { ...m, screenshot } : m
                          )
                        )
                      }
                    />
                  )}
                </Suspense>
              </Canvas>
            </div>

            <div className="list">
              <div className="secondInputContainer">
                <input
                  type="file"
                  id="glbFile"
                  className="fileInput"
                  onChange={onFileChange}
                  multiple
                  accept=".glb"
                />
                <label htmlFor="glbFile">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="48"
                    viewBox="0 -960 960 960"
                    width="48">
                    <path d="M470-265h22v-204l95 96 16-16-123-122-122 123 15 15 97-96v204ZM266-132q-22.775 0-38.387-15.613Q212-163.225 212-186v-588q0-22.775 15.613-38.388Q243.225-828 266-828h326l156 156v486q0 22.775-15.612 38.387Q716.775-132 694-132H266Zm315-530v-144H266q-12 0-22 10t-10 22v588q0 12 10 22t22 10h428q12 0 22-10t10-22v-476H581ZM234-806v144-144 652-652Z" />
                  </svg>
                  Choisissez des fichiers ou faites glisser ici
                </label>
              </div>
              <span>Controls</span>

              <div className="controlsSelect">
                <div className="hdrContainer">
                  <input
                    type="file"
                    id="file"
                    className="hdrInput"
                    onChange={handleHdrInputChange}
                    accept=".hdr"
                  />
                  <label htmlFor="file">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="48"
                      viewBox="0 -960 960 960"
                      width="48">
                      <path d="m139-292 146-196 130.5 174H777L565-596 432-418l-15-19 148-197 256 342H139Zm371-22Zm-327 0h205L285-452 183-314Zm0 0h205-205Z" />
                    </svg>
                    Changer l'envMap
                  </label>
                </div>
                <div className="action" onClick={() => moveCamera([3, 3, 5])}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="48"
                    viewBox="0 -960 960 960"
                    width="48">
                    <path d="M510-305h22v-350H429v22h81v328ZM226-172q-22.775 0-38.387-15.613Q172-203.225 172-226v-508q0-22.775 15.613-38.388Q203.225-788 226-788h508q22.775 0 38.388 15.612Q788-756.775 788-734v508q0 22.775-15.612 38.387Q756.775-172 734-172H226Zm0-22h508q12 0 22-10t10-22v-508q0-12-10-22t-22-10H226q-12 0-22 10t-10 22v508q0 12 10 22t22 10Zm-32-572v572-572Z" />
                  </svg>
                </div>
                <div className="action" onClick={() => moveCamera([3, 3, -5])}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="48"
                    viewBox="0 -960 960 960"
                    width="48">
                    <path d="M388-305h185v-22H410v-111q0-13 9-22.5t23-9.5h77q22 0 38-15.612 16-15.613 16-38.388v-77q0-22.775-16-38.388Q541-655 519-655H388v22h131q13 0 22.5 9.5T551-601v77q0 14-9.5 23t-22.5 9h-77q-22.775 0-38.388 15.612Q388-460.775 388-438v133ZM226-172q-22.775 0-38.387-15.613Q172-203.225 172-226v-508q0-22.775 15.613-38.388Q203.225-788 226-788h508q22.775 0 38.388 15.612Q788-756.775 788-734v508q0 22.775-15.612 38.387Q756.775-172 734-172H226Zm0-22h508q12 0 22-10t10-22v-508q0-12-10-22t-22-10H226q-12 0-22 10t-10 22v508q0 12 10 22t22 10Zm-32-572v572-572Z" />
                  </svg>
                </div>
                <div className="action" onClick={() => moveCamera([-3, 3, -5])}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="48"
                    viewBox="0 -960 960 960"
                    width="48">
                    <path d="M388-305h131q22 0 38-15.612 16-15.613 16-38.388v-76q0-23-10.5-33T542-481q10-3 20.5-12t10.5-32v-76q0-22.775-16-38.388Q541-655 519-655H388v22h131q13 0 22.5 9.5T551-601v77q0 14-9.5 23t-22.5 9h-71v22h71q13 0 22.5 9.5T551-438v79q0 13-9.5 22.5T519-327H388v22ZM226-172q-22.775 0-38.387-15.613Q172-203.225 172-226v-508q0-22.775 15.613-38.388Q203.225-788 226-788h508q22.775 0 38.388 15.612Q788-756.775 788-734v508q0 22.775-15.612 38.387Q756.775-172 734-172H226Zm0-22h508q12 0 22-10t10-22v-508q0-12-10-22t-22-10H226q-12 0-22 10t-10 22v508q0 12 10 22t22 10Zm-32-572v572-572Z" />
                  </svg>
                </div>
                <div className="action" onClick={() => moveCamera([-3, 3, 5])}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="48"
                    viewBox="0 -960 960 960"
                    width="48">
                    <path d="M551-305h22v-350h-22v163H410v-163h-22v185h163v165ZM226-172q-22.775 0-38.387-15.613Q172-203.225 172-226v-508q0-22.775 15.613-38.388Q203.225-788 226-788h508q22.775 0 38.388 15.612Q788-756.775 788-734v508q0 22.775-15.612 38.387Q756.775-172 734-172H226Zm0-22h508q12 0 22-10t10-22v-508q0-12-10-22t-22-10H226q-12 0-22 10t-10 22v508q0 12 10 22t22 10Zm-32-572v572-572Z" />
                  </svg>
                </div>
              </div>
              <span style={{ marginBottom: "1em" }}>Modèles</span>

              {models.map((model, index) => (
                <div
                  className="item"
                  key={index}
                  onClick={() => selectModel(index)}
                  style={{
                    backgroundColor:
                      selectedModelIndex === index ? "#e0e0e0" : "white",
                  }}>
                  <h2>{model.name}</h2>

                  {model.screenshot && (
                    <>
                      <div className="controls">
                        <p>{formatSize(model.size)}</p>

                        <button
                          className="delete"
                          onClick={() => {
                            const newModels = [...models];
                            newModels.splice(selectedModelIndex, 1);
                            setModels(newModels);
                            setSelectedModelIndex(null);
                          }}>
                          <img src="bin.svg" alt="" />
                        </button>
                        <button
                          onClick={() => downloadScreenshot(model.screenshot)}>
                          Download
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

export default App;
