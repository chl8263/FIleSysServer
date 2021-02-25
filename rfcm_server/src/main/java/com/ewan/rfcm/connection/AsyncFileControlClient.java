package com.ewan.rfcm.connection;

import com.ewan.rfcm.connection.protocol.MessagePacker;
import com.ewan.rfcm.connection.protocol.MessageProtocol;
import com.ewan.rfcm.connection.model.WebsocketRequestType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.ByteBuffer;
import java.nio.channels.AsynchronousSocketChannel;
import java.nio.channels.CompletionHandler;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

public class AsyncFileControlClient {

    private static final Logger logger = LoggerFactory.getLogger(AsyncFileControlClient.class);

    private int bufferSize = 2100000;

    private AsynchronousSocketChannel socketChannel;
    private BlockingQueue<String> queue;
    private BlockingQueue<byte[]> byteQueue;

    public AsyncFileControlClient(AsynchronousSocketChannel socketChannel){
        this.socketChannel = socketChannel;
        this.queue = new LinkedBlockingQueue<>();
        this.byteQueue = new LinkedBlockingQueue<>();
        receive();
    }

    public void receive(){
        try{
            ByteBuffer byteBuffer = ByteBuffer.allocate(bufferSize);
            socketChannel.read(byteBuffer, byteBuffer,
                    new CompletionHandler<Integer, ByteBuffer>() {
                        @Override
                        public void completed(Integer result, ByteBuffer attachment) {
                            try {
                                attachment.flip();

                                byte [] byteArr = attachment.array();
                                MessagePacker msg = new MessagePacker(byteArr);

                                byte protocol = msg.getProtocol();
                                if(protocol == MessageProtocol.FILE_DOWN_LOAD){
                                    try {
                                        float fileSize = msg.getLong();
                                        int offSet = msg.getInt();
                                        if(offSet == -1){
                                            queue.put("success");
                                        }else {
                                            int payloadLength = msg.getInt();
                                            byte [] buff = msg.getByte(payloadLength);
                                            byteQueue.add(buff);
                                        }
                                    } catch (Exception e) {
                                        logger.error("[Async client] {}", e.getMessage());
                                    }
                                }else {
                                    int payloadLength = msg.getInt() ;
                                    String payload = (String) msg.getObject(payloadLength);
                                    queue.put(payload);
                                }

                                receive();

                            } catch (Exception e) {
                                logger.error("[Async client] {}", e.getMessage());
                            }
                        }

                        @Override
                        public void failed(Throwable exc, ByteBuffer attachment) {
                            try {
                                String address = socketChannel.getRemoteAddress().toString().substring(1);
                                AsyncFileControlServer.connections.remove(address);
                                socketChannel.close();
                                WebSocketHandler.sendClientInfo(address, WebsocketRequestType.REMOVE);

                                logger.info("[Async client] Cannot connection, close socket : {}", socketChannel.getRemoteAddress() + " : " + Thread.currentThread().getName());
                            } catch (Exception e) {
                                logger.error("[Async client] {}", e.getMessage());
                            }
                        }
                    });
        }catch (Exception e){
            logger.error("[Async client] {}", e.getMessage());
        }
    }

    public void send(byte[] sendData){
        ByteBuffer byteBuffer = ByteBuffer.wrap(sendData);
        socketChannel.write(byteBuffer, byteBuffer, new CompletionHandler<Integer, ByteBuffer>() {
            @Override
            public void completed(Integer result, ByteBuffer attachment) {
                try {
                    //receive();

                } catch (Exception e) {
                    logger.error("[Async client] {}", e.getMessage());
                }
            }

            @Override
            public void failed(Throwable exc, ByteBuffer attachment) {
                try {
                    String address = socketChannel.getRemoteAddress().toString().substring(1);
                    AsyncFileControlServer.connections.remove(address);
                    socketChannel.close();
                    WebSocketHandler.sendClientInfo(address, WebsocketRequestType.REMOVE);

                    logger.info("[Async client] Cannot connection, close socket : {}", socketChannel.getRemoteAddress() + " : " + Thread.currentThread().getName());
                } catch (Exception e) {
                    logger.error("[Async client] {}", e.getMessage());
                }
            }
        });
    }

    public AsynchronousSocketChannel getSocketChannel() {
        return socketChannel;
    }

    public BlockingQueue<String> getQueue(){
        return this.queue;
    }

    public BlockingQueue<byte[]> getByteQueue(){
        return this.byteQueue;
    }
}