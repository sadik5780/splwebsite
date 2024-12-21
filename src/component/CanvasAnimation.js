import React, { useRef, useEffect } from 'react';

const CanvasAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let particles = [];
    const particleRadius = 2.5;

    const random = (max) => Math.random() * max;

    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );

      canvas.width = width;
      canvas.height = height;

      const numParticles = Math.random() * 100 + width / 5;
      particles = Array.from({ length: numParticles }, () => ({
        color: `rgb(${random(255)},${random(255)},${random(255)})`,
        x: random(width),
        y: random(height),
        velocity: random(2) + 1,
      }));
    };

    const drawParticles = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        context.shadowBlur = 10;
        context.shadowColor = particle.color;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particleRadius, 0, Math.PI * 2);
        context.fill();
        particle.y -= particle.velocity;
        if (particle.y < -particleRadius) {
          particle.y = canvas.height;
        }
      });
    };

    const animate = () => {
      drawParticles();
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas
  id="c"
  ref={canvasRef}
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1, // Adjust as needed; make it higher to overlay content
    pointerEvents: 'none', // Prevent interaction blocking
  }}
/>;
};

export default CanvasAnimation;
