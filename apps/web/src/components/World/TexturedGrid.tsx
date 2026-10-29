import { Plane } from '@react-three/drei';

export function TexturedGrid({ size = 50 }: { size?: number }) {
    return (
        <Plane args={[size, size]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <meshStandardMaterial color="#222" wireframe={true} transparent opacity={0.1} />
        </Plane>
    );
}
