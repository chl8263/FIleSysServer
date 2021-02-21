package model;

import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
public class DirectoryInfo {

    private boolean isRoot;
    private List<FileInfo> fileList = new ArrayList<>();

}
