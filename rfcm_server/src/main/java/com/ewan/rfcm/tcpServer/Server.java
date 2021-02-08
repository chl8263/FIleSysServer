package com.ewan.rfcm.tcpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;

public class Server implements Runnable {
    @Override
    public void run() {
        try(ServerSocketChannel serverSocketChannel = ServerSocketChannel.open()){
            serverSocketChannel.configureBlocking(true);
            serverSocketChannel.bind(new InetSocketAddress(15000));

            while (true){
                System.out.println("연결 기다림");
                SocketChannel socketChannel = serverSocketChannel.accept();
                InetSocketAddress isa = (InetSocketAddress) socketChannel.getRemoteAddress();
                System.out.println("[연결 수락함]" + isa.getHostName());
                System.out.println("[연결 수락함2]" + isa.toString());
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}