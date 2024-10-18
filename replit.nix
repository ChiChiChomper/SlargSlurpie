{ pkgs }: {
  deps = [
    pkgs.run
    pkgs.nodePackages.vscode-langservers-extracted
    pkgs.nodePackages.typescript-language-server  
  ];
}