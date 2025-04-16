import React, { useEffect, useRef } from 'react';
import styles from '@/styles/LandingBackground.module.css';

interface LandingBackgroundProps {
  opacity?: number;
}

const LandingBackground: React.FC<LandingBackgroundProps> = ({ opacity = 0.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Particle system
    const particles: Particle[] = [];
    const particleCount = 80;
    const baseHue = 210; // Blue base color
    let mouseX = 0;
    let mouseY = 0;
    let isMouseMoving = false;
    let mouseTimeout: NodeJS.Timeout;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      hue: number;
      targetX: number;
      targetY: number;
      acceleration: number;

      constructor(canvas: HTMLCanvasElement) {
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 1.0;
        this.speedY = (Math.random() - 0.5) * 1.0;
        this.hue = baseHue + Math.random() * 30 - 15;
        this.targetX = this.x;
        this.targetY = this.y;
        this.acceleration = 0.02;
      }

      update(canvas: HTMLCanvasElement, mouseX: number, mouseY: number, isMouseMoving: boolean) {
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;

        if (isMouseMoving) {
          // Calculate distance to mouse
          const dx = mouseX - this.x;
          const dy = mouseY - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            // Move away from mouse
            this.targetX = this.x - dx * 0.5;
            this.targetY = this.y - dy * 0.5;
          } else {
            // Gradually return to normal movement
            this.targetX = this.x + this.speedX * 10;
            this.targetY = this.y + this.speedY * 10;
          }
        } else {
          // Normal movement
          this.x += this.speedX;
          this.y += this.speedY;
        }

        // Smooth movement towards target
        this.x += (this.targetX - this.x) * this.acceleration;
        this.y += (this.targetY - this.y) * this.acceleration;

        // Wrap around edges
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        if (this.y < 0) this.y = height;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 50%, 0.8)`;
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 0.5)`;
        ctx.shadowBlur = 15;
      }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas));
    }

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseMoving = true;

      // Reset mouse movement flag after delay
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        isMouseMoving = false;
      }, 100);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Connect particles with gradient lines
    function connect(ctx: CanvasRenderingContext2D) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            const opacity = (1 - distance / 200) * 0.5;
            const gradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            gradient.addColorStop(0, `hsla(${particles[i].hue}, 100%, 50%, ${opacity})`);
            gradient.addColorStop(1, `hsla(${particles[j].hue}, 100%, 50%, ${opacity})`);

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    // Animation loop
    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
      
      // Reset shadow properties for particles
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      particles.forEach(particle => {
        particle.update(canvas, mouseX, mouseY, isMouseMoving);
        particle.draw(ctx);
      });

      connect(ctx);
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(mouseTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={styles.landingBackground} 
      style={{ opacity }}
    />
  );
};

export default LandingBackground; 