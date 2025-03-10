import TextField from '@mui/material/TextField'


const FillingQuestBio = () => {
    return (
        <>
            <div className="widgets__bio">
                <h4>Био</h4>
                <TextField
                    className="bio-input"
                    id="bio-input"
                    multiline
                    fullWidth
                    minRows={6}
                    maxRows={6}
                    placeholder="Напишите немного о себе, это поможет пользователям лучше понять вас."
                />
            </div>
        </>
    )
}

export default FillingQuestBio