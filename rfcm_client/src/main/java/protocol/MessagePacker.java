package protocol;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class MessagePacker {

    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    private int bufferSize = 2150000;
    private ByteBuffer buffer;
    private int offset = 0;

    public MessagePacker() {
        buffer = ByteBuffer.allocate(bufferSize);
        buffer.clear();
    }

    public MessagePacker(int size){
        buffer = ByteBuffer.allocate(size);
        buffer.clear();
    }

    public MessagePacker(byte[] data){
        buffer = ByteBuffer.allocate(data.length);
        buffer.clear();
        buffer = ByteBuffer.wrap(data);
    }

    public byte[] finish(){
        offset = buffer.position();
        byte[] data = {};
        if(buffer.hasArray()){
            data = buffer.array();
        }
        byte[] result = new byte[offset];
        System.arraycopy(data, 0, result, 0, offset);
        buffer.flip();
        return result;
    }

    public void setProtocol(byte protocol){
        buffer.put(protocol);
    }

    public void setEndianType(ByteOrder option){
        if(option == ByteOrder.BIG_ENDIAN){
            buffer.order(ByteOrder.BIG_ENDIAN);
        }
        else{
            buffer.order(ByteOrder.LITTLE_ENDIAN);
        }
    }

    public void addInt(int param){
        if(buffer.remaining() > Integer.SIZE / Byte.SIZE)
            buffer.putInt(param);
    }

    public void addFloat(float param){
        if(buffer.remaining() > Float.SIZE / Byte.SIZE)
            buffer.putFloat(param);
    }

    public void addLong(long param){
        if(buffer.remaining() > Long.SIZE / Byte.SIZE)
            buffer.putLong(param);
    }

    public void addDouble(double param){
        if(buffer.remaining() > Double.SIZE / Byte.SIZE)
            buffer.putDouble(param);
    }

    public void addString(String param){
        int len = param.getBytes().length;
        if(buffer.remaining() > len){
            buffer.putInt(len);
            buffer.put(param.getBytes());
        }
    }

    public void add(Object param){
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ObjectOutput out = new ObjectOutputStream(bos);
            out.writeObject(param);
            byte[] yourBytes = bos.toByteArray();
            buffer.putInt(yourBytes.length);
            buffer.put(yourBytes);
        } catch (IOException e) {
            logger.error("", e);
        }
    }

    public void addByte(byte[] bytes){
        try {
            int len = bytes.length;
            if(buffer.remaining() > len){
                buffer.put(bytes);
            }
        } catch (Exception e) {
            logger.error("", e);
        }
    }

    public ByteBuffer getBuffer(){
        return buffer;
    }

    public byte getProtocol(){
        return buffer.get();
    }

    public int getInt(){
        return buffer.getInt();
    }

    public float getFloat(){
        return buffer.getFloat();
    }

    public double getDouble(){
        return buffer.getDouble();
    }

    public String getString(){
        int len = buffer.getInt();
        byte[] temp = new byte[len];

        buffer.get(temp);
        String result = new String(temp);
        return result;
    }

    public Object getObject(int len){
        try {
            byte[] temp = new byte[len];
            buffer.get(temp);
            ByteArrayInputStream bis = new ByteArrayInputStream(temp);
            ObjectInput in = new ObjectInputStream(bis);
            Object o = in.readObject();
            return o;
        } catch (Exception e) {
            logger.error("", e);
        }
        return null;
    }

    public byte[] getByte(int len){
        byte[] temp = new byte[len];

        buffer.get(temp);
        return temp;
    }
}
