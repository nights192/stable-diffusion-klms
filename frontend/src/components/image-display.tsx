function ImageDisplay({ images }: { images: Array<String> }) {
    let imageNodes = []

    for (const [i, image] of images) {
        imageNodes.push(<img src={image} alt='A generated image placeholder.'/>);
    }

    return <div className='flex w-full h-full' >
        {imageNodes}
    </div>;
}

export default ImageDisplay;