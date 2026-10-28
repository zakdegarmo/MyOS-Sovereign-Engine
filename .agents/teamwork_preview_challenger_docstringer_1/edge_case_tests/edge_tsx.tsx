import React from 'react';

/**
 * Defines the type structure for button component props, requiring a display label and a callback function to handle clicks.
 */
export interface ButtonProps {
    label: string;
    onClick: () => void;
}

/**
 * Defines a string literal union type that enforces specific, allowed style variants ('compact' or 'expanded') for rendering cards within the application.
 */
export type CardStyle = 'compact' | 'expanded';

export const PrimaryButton: React.FC<ButtonProps> = ({ label, onClick }) => {
    const handleClick = () => {
        onClick();
    };
    return <button onClick={handleClick}>{label}</button>;
};

/**
 * A React functional component designed to display a main heading by rendering the value of the `title` property within an `<h1>` tag. It uses TypeScript generics to ensure that the provided props object must include a string-based title field.
 */
export function HeaderComponent<T extends { title: string }>(props: T): JSX.Element {
    return <h1>{props.title}</h1>;
}

/**
 * A simple React class component that renders the static title "Class Component" upon mounting.
 */
class TSXClassComponent extends React.Component {
        /**
     * Renders a div element containing the static string "Class Component", simulating the output of a title function within a React component.
     */
    render() {
        const getTitle = () => 'Class Component';
        return <div>{getTitle()}</div>;
    }
}
