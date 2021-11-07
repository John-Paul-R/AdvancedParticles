export const sumEven = (nums: number[]) =>
    nums.reduce((tot, cur) => (cur % 2 === 0 ? tot + cur : tot));

const containerDivId = "advanced_particles-container";

const initCanvas = () => {
    const containerDiv = document.getElementById(containerDivId);
    if (containerDiv === null) {
        throw new Error(`No container div with id ${containerDivId} found.`);
    }
    const canvas = document.createElement("canvas");
    containerDiv.appendChild(canvas);

    return canvas;
};

export function init() {
    const canvas = initCanvas();
    const ctx = canvas.getContext("2d")!;
    const { width, height } = ctx.canvas;

    ctx.fillStyle = "#353535";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#656565";
    ctx.fillRect(10, 10, 10, 10);
}

type SystemSettings = {};

type SystemState = {};

type FrameGenerationProps = {
    settings: SystemSettings;
    state: SystemState;
};

function nextFrame({ settings, state }: FrameGenerationProps) {}
