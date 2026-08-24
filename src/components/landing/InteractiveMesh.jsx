"use client";

import { useEffect, useRef } from "react";

export default function InteractiveMesh() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let particles = [];
    const spacing = 50; // Grid spacing

    const initParticles = () => {
      particles = [];
      // Create grid of particles covering the whole screen
      for (let x = 0; x <= width; x += spacing) {
        for (let y = 0; y <= height; y += spacing) {
          particles.push({
            x: x,
            y: y,
            baseX: x,
            baseY: y,
          });
        }
      }
    };
    initParticles();

    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // We only want to compute for particles near the mouse for performance
      const interactionRadius = 250;
      const connectionRadius = 80;

      // Filter active particles to save CPU
      const activeParticles = [];
      
      particles.forEach((p) => {
        const dx = mouse.x - p.baseX;
        const dy = mouse.y - p.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < interactionRadius * 1.5) {
          activeParticles.push(p);
          
          if (dist < interactionRadius) {
            // Push away
            const force = (interactionRadius - dist) / interactionRadius;
            const targetX = p.baseX - (dx / dist) * force * 35;
            const targetY = p.baseY - (dy / dist) * force * 35;
            
            p.x += (targetX - p.x) * 0.15;
            p.y += (targetY - p.y) * 0.15;
          } else {
            // Return to base
            p.x += (p.baseX - p.x) * 0.05;
            p.y += (p.baseY - p.y) * 0.05;
          }

          // Draw dot - Make it much darker/more subtle
          const dotAlpha = 0.15 * (1 - dist / (interactionRadius * 1.5));
          if (dotAlpha > 0.01) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(244, 114, 182, ${dotAlpha})`; // Pinkish
            ctx.fill();
          }
        } else {
          // Instantly return to base if far away
          p.x = p.baseX;
          p.y = p.baseY;
        }
      });

      // Draw connections only between active particles
      ctx.lineWidth = 1;
      for (let i = 0; i < activeParticles.length; i++) {
        for (let j = i + 1; j < activeParticles.length; j++) {
          const p1 = activeParticles[i];
          const p2 = activeParticles[j];
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionRadius) {
            // Line alpha based on mouse distance to midpoint
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const mouseDist = Math.sqrt(Math.pow(mouse.x - midX, 2) + Math.pow(mouse.y - midY, 2));
            
            if (mouseDist < interactionRadius) {
               // Make lines much darker/more subtle
               const alpha = 0.1 * (1 - mouseDist / interactionRadius);
               ctx.beginPath();
               ctx.moveTo(p1.x, p1.y);
               ctx.lineTo(p2.x, p2.y);
               ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`; // Orange
               ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ mixBlendMode: 'screen' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
