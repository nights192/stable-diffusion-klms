function Button({ onClick, children }: { onClick?: () => void, children: string }) {
    return <button
        onClick={onClick}
        className='bg-violet-600 text-2xl text-zinc-200 font-bold px-8 py-1 rounded align-middle text-center mx-auto md:mx-0 flex-none'>
        {children}
    </button>;
}

export default Button;