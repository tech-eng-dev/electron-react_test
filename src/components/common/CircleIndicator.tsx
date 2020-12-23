import React from 'react';
const CircleIndicator = ({ color, size }: { color: string, size: number }) => {
    return <div style={{ backgroundColor: color, width: size, height: size, borderRadius: '50%' }}></div>
}
export default CircleIndicator;