import { useModelStore } from '../store/modelStore'

export default function ModelSelector({ modelsConfig }) {
    const currentModelIndex = useModelStore((s) => s.currentModelIndex)
    const setCurrentModelIndex = useModelStore((s) => s.setCurrentModelIndex)

    function handleSwitch(index) {
        if (index === currentModelIndex) return
        setCurrentModelIndex(index)
    }

    return (
        <nav className="model-selector">
            {modelsConfig.map((config, i) => (
                <button
                    key={i}
                    className={`selector-btn${currentModelIndex === i ? ' active' : ''}`}
                    onClick={() => handleSwitch(i)}
                >
                    {config.label}
                </button>
            ))}
        </nav>
    )
}
