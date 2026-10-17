{
  description = "RAYMOSAIC dependency-free static prototype";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs = { self, nixpkgs }:
    let system = "x86_64-linux"; pkgs = import nixpkgs { inherit system; }; in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.nodejs_22 pkgs.python3 ];
        shellHook = ''echo "RAYMOSAIC · run: python3 -m http.server 8000"'';
      };
    };
}