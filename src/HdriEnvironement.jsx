import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { PMREMGenerator } from "three";
import * as THREE from "three";
function HdriEnvironment({ hdriUrl }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    if (hdriUrl) {
      const pmremGenerator = new PMREMGenerator(gl);
      const loader = new RGBELoader();
      loader.setDataType(THREE.FloatType).load(hdriUrl, (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
      });
    }
  }, [gl, scene, hdriUrl]);

  return null;
}

export default HdriEnvironment;
