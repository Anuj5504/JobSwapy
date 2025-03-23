import { useRef, useEffect, useState } from 'react';

export const useDrag = () => {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const initialPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = dragRef.current;
    if (!element) return;

    const handleMouseDown = (e) => {
      setIsDragging(true);
      initialPosition.current = {
        x: e.clientX - currentPosition.current.x,
        y: e.clientY - currentPosition.current.y
      };
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - initialPosition.current.x;
      const newY = e.clientY - initialPosition.current.y;
      
      element.style.transform = `translate(${newX}px, ${newY}px)`;
      currentPosition.current = { x: newX, y: newY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return [isDragging, dragRef];
}; 