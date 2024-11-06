import { VideoClient } from '@zoom/videosdk'
import React, { MutableRefObject } from 'react'

interface Props {
    client: MutableRefObject<typeof VideoClient>
}

const MessageButton:React.FC<Props> = ({
    client
}) => {
  return (
    <div>MessageButton</div>
  )
}

export default MessageButton