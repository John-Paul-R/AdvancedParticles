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
    sizeSupplier: (state: ParticleState) => number;
    velocity: number | NumberRange;
    bounds: BoundingBox;
    colorSupplier?: (state: ParticleState) => string;
    maxLineRange?: number;
    lineColorSupplier?: (
        particle1: ParticleState,
        particle2: ParticleState
    ) => string;
    circleMode?: "fill" | "stroke" | "disabled";
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
    renderCallback?: (info: {}) => void;
};

function generateParticles({
    particleCount,
    sizeSupplier,
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

let frameCount = 0;
const averageTimes: { [key: string]: number } = {
    lines: 0,
    circles: 0,
    nextState: 0,
};

const calcRollingAvg = (
    currentAvg: number,
    frameCount: number,
    startTime: number,
    endTime: number
) =>
    currentAvg * ((frameCount - 1) / frameCount) +
    (endTime - startTime) * (1 / frameCount);

/**
 * Renders the current frame, generates the next state, and
 * calls requestAnimationFrame with this new state. (infinite)
 */
export function nextFrame({
    ctx,
    settings,
    state,
    renderCallback,
}: FrameGenerationProps) {
    frameCount += 1;
    // "nextState" and "renderFrame" are logically separate...
    // However it might be worth keeping them in same loop for
    // performance?

    // We can do a lot more cool things with this if rendering is separate...
    // (e.g. transforming the entire system based on some other function)
    const {
        maxLineRange,
        sizeSupplier,
        colorSupplier = () => "#656565",
        circleMode,
        lineColorSupplier = () => "#353535",
    } = settings;
    const { particles } = state;
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    // Relates colors to array of particle pairs
    const lineBatches: { [key: string]: ParticleState[][] } = {};

    const batchLine = (
        particle1: ParticleState,
        particle2: ParticleState,
        maxRange: number
    ) => {
        if (
            (particle2.x - particle1.x) ** 2 +
                (particle2.y - particle1.y) ** 2 <
            maxRange ** 2
        ) {
            const color = lineColorSupplier(particle1, particle2);
            let batch = lineBatches[color];
            if (batch === undefined) {
                batch = [];
                lineBatches[color] = batch;
            }
            batch.push([particle1, particle2]);
        }
    };

    // Lines loop
    {
        const start = performance.now();

        if (maxLineRange) {
            for (let i = 0; i < particles.length; i++) {
                // draw some lines
                for (let j = i + 1; j < particles.length; j++) {
                    batchLine(particles[i], particles[j], maxLineRange);
                }
            }
            for (const [color, particlePairs] of Object.entries(lineBatches)) {
                ctx.beginPath();
                ctx.strokeStyle = color;
                for (let i = 0; i < particlePairs.length; i++) {
                    const pair = particlePairs[i];
                    ctx.moveTo(pair[0].x, pair[0].y);
                    ctx.lineTo(pair[1].x, pair[1].y);
                }
                ctx.stroke();
                ctx.closePath();
            }
        }

        averageTimes["lines"] = calcRollingAvg(
            averageTimes["lines"],
            frameCount,
            start,
            performance.now()
        );
    }
    // TODO: Technically lines should be a separate iteration from circles...
    // (because circles should always be above) Current implementation depends on order.

    {
        const start = performance.now();
        // Circles loop
        if (circleMode !== "disabled") {
            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i];

                // draw some circles
                ctx.fillStyle = colorSupplier(particle);
                ctx.strokeStyle = ctx.fillStyle;
                const size = sizeSupplier(particle);
                ctx.moveTo(particle.x, particle.y);
                ctx.beginPath();
                ctx.ellipse(
                    particle.x,
                    particle.y,
                    size,
                    size,
                    Math.PI * 2,
                    0,
                    Math.PI * 2
                );
                circleMode === "fill" ? ctx.fill() : ctx.stroke();
                ctx.closePath();
            }
        }
        averageTimes["circles"] = calcRollingAvg(
            averageTimes["circles"],
            frameCount,
            start,
            performance.now()
        );
    }

    const nextParticles: ParticleState[] = [];
    {
        const start = performance.now();
        // calc next particle state
        for (let i = 0; i < particles.length; i++) {
            nextParticles.push(nextParticleState(particles[i], settings));
        }
        averageTimes["nextState"] = calcRollingAvg(
            averageTimes["nextState"],
            frameCount,
            start,
            performance.now()
        );
    }

    renderCallback?.(averageTimes);

    requestAnimationFrame((time) =>
        nextFrame({
            ctx,
            settings,
            state: { particles: nextParticles },
            renderCallback,
        })
    );
}

// TODO: Rename option: "Contentful Particles"
