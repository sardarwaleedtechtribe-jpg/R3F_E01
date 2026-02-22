import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Experience from './components/Experience'
import ModelSelector from './components/ModelSelector'
import { useModelStore } from './store/modelStore'

gsap.registerPlugin(ScrollTrigger)

const MODELS_CONFIG = [
    { path: '/assets/bunny_can.glb', scale: 0.7, rotation: { z: -0.1645 }, label: 'Bunny' },
    { path: '/assets/beer_can.glb', scale: 1.1, rotation: { y: 0 }, label: 'Beer' },
    { path: '/assets/retro_pepsi_can.glb', scale: 0.185, rotation: { y: 0 }, label: 'Retro Pepsi' },
    { path: '/assets/can.glb', scale: 20, rotation: { y: 0 }, label: 'Original Can' },
]

export default function App() {
    const scanContainerRef = useRef(null)
    const setScrollProgress = useModelStore((s) => s.setScrollProgress)
    const setIsFloating = useModelStore((s) => s.setIsFloating)
    const triggerScannerEnter = useModelStore((s) => s.triggerScannerEnter)
    const triggerScannerLeave = useModelStore((s) => s.triggerScannerLeave)

    useEffect(() => {
        // Smooth scroll via Lenis
        const lenis = new Lenis()
        lenis.on('scroll', (e) => {
            ScrollTrigger.update()
            setScrollProgress(e.scroll / window.innerHeight)
        })
        gsap.ticker.add((time) => { lenis.raf(time * 1000) })
        gsap.ticker.lagSmoothing(0)

        // Scanner section scroll trigger
        const stickyHeight = window.innerHeight
        const trigger = ScrollTrigger.create({
            trigger: '.scanner',
            start: 'top top',
            end: `${stickyHeight}px`,
            pin: true,
            onEnter: () => {
                setIsFloating(false)
                triggerScannerEnter()
                // collapse scan container
                if (scanContainerRef.current) {
                    gsap.to(scanContainerRef.current, { scale: 0, duration: 0.5, delay: 1.5 })
                }
            },
            onLeaveBack: () => {
                setIsFloating(true)
                triggerScannerLeave()
                if (scanContainerRef.current) {
                    gsap.to(scanContainerRef.current, { scale: 1, duration: 0.5 })
                }
            },
        })

        return () => {
            lenis.destroy()
            trigger.kill()
            gsap.ticker.remove((time) => { lenis.raf(time * 1000) })
        }
    }, [setScrollProgress, setIsFloating, triggerScannerEnter, triggerScannerLeave])

    return (
        <>
            {/* Fixed R3F Canvas */}
            <div className="canvas-wrapper">
                <Experience modelsConfig={MODELS_CONFIG} />
            </div>

            {/* HTML Sections */}
            <div className="sections-wrapper">
                {/* Hero */}
                <section className="hero">
                    <h1>Digital <br /> Experience</h1>
                    <h2>Transform your brand identity</h2>
                    <p>We build immersive digital experiences that captivate your audience and elevate your brand.</p>
                </section>

                {/* Info */}
                <section className="info">
                    <div className="tags">
                        <p>Premium Design</p>
                        <p>Immersive Experiences</p>
                        <p>Brand Elevation</p>
                        <p>Digital Innovation</p>
                    </div>
                    <h2>
                        We help brands find their voice in the digital age but drastically
                        improve their online presence and user engagement through
                        thoughtful design and cutting-edge technology.
                    </h2>
                    <p>Our approach combines creativity, strategy, and technology to deliver results that matter. We believe that
                        great design can change the world and we are passionate about making a difference through our work.</p>
                </section>

                {/* Scanner */}
                <section className="scanner">
                    <div className="scan-info">
                        <div className="product-id"><h2>#2024</h2></div>
                        <div className="product-description"><p>Transform your brand identity</p></div>
                    </div>
                    <div className="scan-container" ref={scanContainerRef}></div>
                    <div className="barcode">
                        <img src="/assets/bar-code.png" alt="bar-code" />
                    </div>
                    <div className="purchased"><p>Innovation Verified</p></div>
                </section>

                {/* Outro */}
                <section className="outro">
                    <h2>Ready to elevate your brand? <br /> Let&apos;s create something extraordinary together.</h2>
                </section>
            </div>

            {/* Model Selector Nav */}
            <ModelSelector modelsConfig={MODELS_CONFIG} />
        </>
    )
}
