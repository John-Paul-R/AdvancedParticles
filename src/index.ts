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

type NumberRange = {
    min: number;
    max: number;
};

const randInRange = ({ min, max }: NumberRange) =>
    Math.random() * (max - min) + min;

const randIntInRange = ({ min, max }: NumberRange) =>
    Math.round(Math.random() * (max - min) + min);

type Rectangle = {
    x: number;
    y: number;
    w: number;
    h: number;
};

type BoundingBox = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};

const rectToBounds = ({ x, y, w, h }: Rectangle): BoundingBox => ({
    x1: x,
    y1: y,
    x2: x + w,
    y2: y + h,
});

type SystemSettings = {
    particleCount: number;
    size: number | NumberRange;
    velocity: number | NumberRange;
    bounds: BoundingBox;
};

type ParticleState = {
    x: number;
    y: number;
    velocity: number;
    /**
     * angle component of velocity
     */
    direction: number;
};

type SystemState = {
    particles: ParticleState[];
};

type FrameGenerationProps = {
    ctx: CanvasRenderingContext2D;
    settings: SystemSettings;
    state: SystemState;
};

function generateParticles({
    particleCount,
    size,
    velocity,
    bounds,
}: SystemSettings) {
    const particles: ParticleState[] = [];
    const { x1, y1, x2, y2 } = bounds;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: randInRange({ min: x1, max: x2 }),
            y: randInRange({ min: y1, max: y2 }),
            velocity:
                typeof velocity === "number" ? velocity : randInRange(velocity),
            direction: Math.random() * 2 * Math.PI,
        });
    }
    return particles;
}

export function generateInitialState(settings: SystemSettings) {
    return {
        particles: generateParticles(settings),
    };
}

const timeFactor = 10 / 60;

const isInRange = (num: number, { min, max }: NumberRange) =>
    num > min && num < max;

const flipDirection = (cos: number, sin: number, axis: "x" | "y") => {
    if (axis === "x") {
        return Math.atan2(sin, -cos);
    }
    return Math.atan2(-sin, cos);
};

const computeNextDirection = (
    cos: number,
    sin: number,
    x: number,
    y: number,
    bounds: BoundingBox
) => {
    const nextCos = isInRange(x, { min: bounds.x1, max: bounds.x2 })
        ? cos
        : -cos;
    const nextSin = isInRange(y, { min: bounds.y1, max: bounds.y2 })
        ? sin
        : -sin;
    return Math.atan2(nextSin, nextCos);
};

const nextParticleState = (
    state: ParticleState,
    settings: SystemSettings
): ParticleState => {
    const distTraveled = state.velocity * timeFactor;
    const cos = Math.cos(state.direction); // x-component
    const sin = Math.sin(state.direction); // y-component
    const nextX = state.x + cos * distTraveled;
    const nextY = state.y + sin * distTraveled;

    return {
        x: nextX,
        y: nextY,
        velocity: state.velocity,
        direction: computeNextDirection(
            cos,
            sin,
            nextX,
            nextY,
            settings.bounds
        ),
    };
};

export function nextFrame({ ctx, settings, state }: FrameGenerationProps) {
    // "nextState" and "renderFrame" are logically separate...
    // However it might be worth keeping them in same loop for
    // performance?

    const { particles } = state;
    const nextParticles: ParticleState[] = [];
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.fillStyle = "#353535";
    for (const particle of particles) {
        // draw some circles
        // ctx.fillStyle = "#353535";
        ctx.moveTo(particle.x, particle.y);
        ctx.ellipse(particle.x, particle.y, 3, 3, Math.PI * 2, 0, Math.PI * 2);
        nextParticles.push(nextParticleState(particle, settings));
    }
    ctx.stroke();
    ctx.closePath();

    requestAnimationFrame((time) =>
        nextFrame({ ctx, settings, state: { particles: nextParticles } })
    );
}

// TODO: Rename option: "Contentful Particles"
