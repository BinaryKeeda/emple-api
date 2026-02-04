// socket/testSocket.js
import { TestResponse } from "../../../models/test/TestResponse.js"

export default function registerTestSocket(socket) {
    socket.on('register-test-session', async ({ testResponseId }) => {
      socket.data.testResponseId = testResponseId;
    })

    socket.on('disconnect', async () => {
      const testResponseId = socket.data.testResponseId
      if (!testResponseId) return

      try {
        const response = await TestResponse.findById(testResponseId)
        if (
          !response ||
          response.isSubmitted ||     
          !response.startedAt ||     
          response.pausedAt          
        ) return

        response.pausedAt = new Date()
        await response.save()
      } catch (err) {
      }
    })
}
