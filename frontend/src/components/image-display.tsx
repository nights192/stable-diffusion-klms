function ImageDisplay({ images }: { images: string[] }) {
    let imageNodes = []

    for (const [i, image] of images.entries()) {
        imageNodes.push(<img src={image} alt='Our generated art placeholder.' className='flex-initial min-w-0 w-full md:w-1/2' key={i}/>);
    }

    return <div className='flex flex-col md:flex-row w-full h-full items-center gap-4 place-content-center' >
        {imageNodes}
    </div>;
}

export default ImageDisplay;