import React, { useEffect, useRef } from 'react';

interface WheelCanvasProps {
  candidates: string[];
  spinning: boolean;
  targetIndex: number | null;
  onSpinComplete?: () => void;
  onTickSound?: () => void;
}

const COLORS = [
  '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6',
  '#F97316', '#14B8A6', '#6366F1', '#D97706', '#06B6D4'
];

export const WheelCanvas: React.FC<WheelCanvasProps> = ({
  candidates,
  spinning,
  targetIndex,
  onSpinComplete,
  onTickSound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastSegmentRef = useRef<number>(-1);

  // Draw static or spinning wheel
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 15;

    ctx.clearRect(0, 0, width, height);

    if (candidates.length === 0) {
      // Empty wheel state
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f5f5f4';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#e7e5e4';
      ctx.stroke();

      ctx.fillStyle = '#a8a29e';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('請先加入學生名單', centerX, centerY);
      return;
    }

    const numSegments = candidates.length;
    const arcSize = (Math.PI * 2) / numSegments;

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1917';
    ctx.fill();

    // Segments
    for (let i = 0; i < numSegments; i++) {
      const segStart = angle + i * arcSize;
      const segEnd = segStart + arcSize;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, segStart, segEnd);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text inside segment
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segStart + arcSize / 2);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      // Dynamic font size depending on number of candidates
      const fontSize = Math.max(10, Math.min(18, Math.floor(220 / Math.max(10, numSegments))));
      ctx.font = `bold ${fontSize}px sans-serif`;

      const text = candidates[i];
      const truncatedText = text.length > 8 ? text.slice(0, 7) + '…' : text;
      ctx.fillText(truncatedText, radius - 20, 0);

      ctx.restore();
    }

    // Center Pin Circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1c1917';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [candidates]);

  // Handle spin animation
  useEffect(() => {
    if (spinning && targetIndex !== null && candidates.length > 0) {
      const numSegments = candidates.length;
      const arcSize = (Math.PI * 2) / numSegments;

      // Pointer is at the top (angle: -PI/2 or 3*PI/2)
      // Segment target offset: segment index targetIndex should end at pointer
      const targetSegmentCenter = targetIndex * arcSize + arcSize / 2;
      
      // Calculate final target angle so pointer (at 1.5 * PI) points to targetSegmentCenter
      const targetPointerAngle = (1.5 * Math.PI) - targetSegmentCenter;
      
      // Ensure extra spins (e.g. 5 to 7 full rotations)
      const currentMod = currentAngleRef.current % (Math.PI * 2);
      const extraRounds = Math.PI * 2 * 6;
      const totalTargetAngle = currentAngleRef.current + (targetPointerAngle - currentMod + Math.PI * 2) % (Math.PI * 2) + extraRounds;

      const startTime = performance.now();
      const duration = 4000; // 4 seconds spin

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle = currentAngleRef.current + (totalTargetAngle - currentAngleRef.current) * easeOut;

        // Sound tick check when crossing segment boundary
        const currentSegment = Math.floor(((1.5 * Math.PI - (currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / arcSize);
        if (currentSegment !== lastSegmentRef.current) {
          lastSegmentRef.current = currentSegment;
          if (onTickSound) onTickSound();
        }

        drawWheel(currentAngle);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          currentAngleRef.current = totalTargetAngle % (Math.PI * 2);
          if (onSpinComplete) onSpinComplete();
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [spinning, targetIndex]);

  return (
    <div className="relative inline-block">
      {/* Top Pointer Needle */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 filter drop-shadow-md">
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-500" />
      </div>

      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        className="max-w-full h-auto drop-shadow-lg"
      />
    </div>
  );
};
