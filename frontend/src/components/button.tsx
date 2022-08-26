const theme = 'bg-violet-600 hover:bg-violet-700 text-2xl text-zinc-200 font-bold px-8 py-1 rounded align-middle text-center mx-auto md:mx-0 flex-none';

function Button({ onClick, children }: { onClick?: () => void, children: string }) {
    return <button
        onClick={onClick}
        className={theme}>
        {children}
    </button>;
}

export default Button;