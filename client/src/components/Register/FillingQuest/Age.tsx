import TextField from '@mui/material/TextField'


const FillingQuestAge = () => {
    return (
        <>
            <div className="widgets__age">
                <h4>Сколько вам лет</h4>
                    <TextField
                        className="age-input"
                        id="age-input"
                        fullWidth
                        placeholder="Возвраст"
                    />
                <p className="description">Минимальный возраст для регистрации: 18 лет</p>
            </div>
        </>
    )
}

export default FillingQuestAge