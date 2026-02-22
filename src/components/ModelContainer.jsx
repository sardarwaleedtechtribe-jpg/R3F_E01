import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { useModelStore } from '../store/modelStore'

function prepareMesh(node) {
    if (node.isMesh && node.material) {
        node.material.metalness = 0.3
        node.material.roughness = 0.4
        node.material.envMapIntensity = 1.5
        node.castShadow = true
        node.receiveShadow = true
    }
}

function Model({ config, index }) {
    const groupRef = useRef()
    const { scene: gltfScene } = useGLTF(config.path)

    const isFloating = useModelStore((s) => s.isFloating)
    const currentModelIndex = useModelStore((s) => s.currentModelIndex)
    const scrollProgress = useModelStore((s) => s.scrollProgress)
    const scannerEnterCount = useModelStore((s) => s.scannerEnterCount)
    const scannerLeaveCount = useModelStore((s) => s.scannerLeaveCount)

    const isActive = currentModelIndex === index
    const wasActive = useRef(null)  // null = unmounted, so first activation is always "new"
    const scaleProxy = useRef({ val: 0 })
    const scannerEnterHandled = useRef(0)
    const scannerLeaveHandled = useRef(0)

    // Clone + center geometry on first mount
    useEffect(() => {
        if (!gltfScene || !groupRef.current) return

        const clone = gltfScene.clone(true)
        clone.traverse(prepareMesh)

        clone.updateMatrixWorld(true)
        const box = new THREE.Box3()
        clone.traverse((node) => {
            if (node.isMesh) {
                node.geometry.computeBoundingBox()
                const meshBox = node.geometry.boundingBox.clone()
                meshBox.applyMatrix4(node.matrixWorld)
                box.union(meshBox)
            }
        })
        const center = box.getCenter(new THREE.Vector3())
        clone.position.set(
            -center.x + (config.offset?.x || 0),
            -center.y + (config.offset?.y || 0),
            -center.z + (config.offset?.z || 0)
        )

        if (config.rotation) {
            clone.rotation.x = config.rotation.x || 0
            clone.rotation.y = config.rotation.y || 0
            clone.rotation.z = config.rotation.z || 0
        }

        groupRef.current.add(clone)

        if (index === 0) {
            groupRef.current.visible = true
            gsap.to(scaleProxy.current, {
                val: config.scale,
                duration: 1.5,
                ease: 'power2.out',
                onUpdate: () => {
                    const v = scaleProxy.current.val
                    groupRef.current?.scale.set(v, v, v)
                },
            })
            wasActive.current = true
        } else {
            wasActive.current = false
        }

        return () => {
            groupRef.current?.remove(clone)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gltfScene])

    // Model switching
    useEffect(() => {
        if (wasActive.current === null) return  // still loading
        const group = groupRef.current
        if (!group) return

        if (isActive && !wasActive.current) {
            group.visible = true
            gsap.killTweensOf(scaleProxy.current)
            gsap.to(scaleProxy.current, {
                val: config.scale,
                duration: 0.8,
                delay: 0.2,
                ease: 'back.out(1.7)',
                onUpdate: () => {
                    const v = scaleProxy.current.val
                    group.scale.set(v, v, v)
                },
            })
        } else if (!isActive && wasActive.current) {
            gsap.killTweensOf(scaleProxy.current)
            gsap.to(scaleProxy.current, {
                val: 0,
                duration: 0.5,
                ease: 'power2.in',
                onUpdate: () => {
                    const v = scaleProxy.current.val
                    group.scale.set(v, v, v)
                },
                onComplete: () => { group.visible = false },
            })
        }
        wasActive.current = isActive
    }, [isActive, config.scale])

    // Scanner enter animation
    useEffect(() => {
        if (!isActive || scannerEnterCount === 0) return
        if (scannerEnterCount <= scannerEnterHandled.current) return
        scannerEnterHandled.current = scannerEnterCount

        const group = groupRef.current
        if (!group) return
        group.position.y = 0

        const audio = new Audio('/assets/scan.mp3')
        setTimeout(() => { audio.currentTime = 0; audio.play().catch(() => { }) }, 500)

        gsap.killTweensOf(group.rotation)
        gsap.to(group.rotation, {
            y: group.rotation.y + Math.PI * 2,
            duration: 1,
            ease: 'power2.inOut',
            onComplete: () => {
                gsap.killTweensOf(scaleProxy.current)
                gsap.to(scaleProxy.current, {
                    val: 0,
                    duration: 0.5,
                    onUpdate: () => {
                        const v = scaleProxy.current.val
                        group.scale.set(v, v, v)
                    },
                })
            },
        })
    }, [scannerEnterCount, isActive])

    // Scanner leave animation
    useEffect(() => {
        if (!isActive || scannerLeaveCount === 0) return
        if (scannerLeaveCount <= scannerLeaveHandled.current) return
        scannerLeaveHandled.current = scannerLeaveCount

        const group = groupRef.current
        if (!group) return
        gsap.killTweensOf(scaleProxy.current)
        gsap.to(scaleProxy.current, {
            val: config.scale,
            duration: 1,
            onUpdate: () => {
                const v = scaleProxy.current.val
                group.scale.set(v, v, v)
            },
        })
    }, [scannerLeaveCount, isActive, config.scale])

    // Per-frame floating + scroll rotation
    useFrame(() => {
        const group = groupRef.current
        if (!group || !isActive) return

        if (isFloating) {
            group.position.y = Math.sin(Date.now() * 0.001 * 1.5) * 0.0125
        }

        const clamped = Math.min(scrollProgress, 1)
        if (clamped < 1) {
            group.rotation.y += 0.01 * 0.3
            group.rotation.x = clamped * Math.PI * 2
        }
    })

    return (
        <group
            ref={groupRef}
            visible={false}
            scale={[0, 0, 0]}
        />
    )
}

export default function ModelContainer({ modelsConfig }) {
    return (
        <>
            {modelsConfig.map((config, i) => (
                <Model key={config.path} config={config} index={i} />
            ))}
        </>
    )
}