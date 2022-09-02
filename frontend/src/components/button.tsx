const themeActive = 'bg-violet-600 hover:bg-violet-700 text-2xl text-zinc-200 font-bold px-8 py-1 rounded align-middle text-center mx-auto md:mx-0 flex-none';
const themeInactive = 'bg-neutral-700 text-2xl text-zinc-300 font-bold px-8 py-1 rounded align-middle text-center mx-auto md:mx-0 flex-none';

function Button({ onClick, active, children }: { onClick?: () => void, active?: boolean, children: string }) {
    return (active === undefined || active) ? <button className={themeActive} onClick={onClick}>
        {children}
    </button> : <button className={themeInactive}>
        {children}
    </button>;
}

export default Button;