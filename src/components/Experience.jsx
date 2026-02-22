import { Canvas } from '@react-three/fiber'
import ModelContainer from './ModelContainer'

export default function Experience({ modelsConfig }) {
    return (
        <Canvas
            camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 1000 }}
            gl={{
                antialias: true,
                alpha: true,
            }}
            onCreated={({ gl }) => {
                gl.setClearColor(0xffffff, 1)
                gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
                gl.shadowMap.enabled = true
                gl.physicallyCorrectLights = true
            }}
            style={{ width: '100%', height: '100%' }}
            toneMapping={4} // ACESFilmicToneMapping
            toneMappingExposure={1.5}
        >
            {/* Lighting */}
            <ambientLight intensity={3} />
            <directionalLight position={[5, 10, 7.5]} intensity={1} />
            <directionalLight position={[-5, 0, -5]} intensity={3} />
            <hemisphereLight skyColor={0xffffff} groundColor={0xffffff} intensity={2} position={[0, 25, 0]} />

            {/* All models */}
            <ModelContainer modelsConfig={modelsConfig} />
        </Canvas>
    )
}
