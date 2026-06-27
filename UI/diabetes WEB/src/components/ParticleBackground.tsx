/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
      alpha: number;
      pulseSpeed: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.min(35, Math.floor((canvas.width * canvas.height) / 50000));
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 2.5 + 1.0;
        // Use either mild orange or soft warm gray for particles
        const isOrange = Math.random() > 0.5;
        const color = isOrange ? '249, 115, 22' : '148, 163, 184';
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius,
          color,
          speedX: (Math.random() - 0.5) * 0.15, // slower and calmer
          speedY: (Math.random() - 0.5) * 0.15,
          alpha: Math.random() * 0.2 + 0.08, // softer/fainter
          pulseSpeed: Math.random() * 0.01 + 0.002,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle ambient lights/gradients in mild orange/amber
      const bgGrad = ctx.createRadialGradient(
        canvas.width * 0.15, canvas.height * 0.2, 0,
        canvas.width * 0.15, canvas.height * 0.2, canvas.width * 0.6
      );
      bgGrad.addColorStop(0, 'rgba(249, 115, 22, 0.025)');
      bgGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Move particle
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around screen boundaries
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Pulse alpha
        p.alpha += p.pulseSpeed;
        if (p.alpha > 0.35 || p.alpha < 0.05) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        // Draw glowing particle
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
        gradient.addColorStop(0, `rgba(${p.color}, ${p.alpha})`);
        gradient.addColorStop(0.6, `rgba(${p.color}, ${p.alpha * 0.25})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with thin faint lines
        particles.forEach((other) => {
          const dist = Math.hypot(p.x - other.x, p.y - other.y);
          if (dist < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(148, 163, 184, ${0.03 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      id="bg-particles-canvas"
    />
  );
}
