import SvgCamera from '../../../assets/icon/camera.svg'


const FillingQuestPhotos = () => {

    return (
        <>
            <div className="widgets__photo">
                <h4 className="headline">Мои фото</h4>
                <div className="items">
                    <div className="items__1 item">sdsdvsv</div>
                    <div className="items__2 item">sdvsdv</div>
                    <div className="items__loading item">
                        <input className="btn" type="file" />
                        <img src={SvgCamera} alt="camera" />
                    </div>
                </div>
            </div>
        </>
    )
}

export default FillingQuestPhotos