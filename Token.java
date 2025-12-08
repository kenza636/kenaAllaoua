package com.mycompany.analyseurlexicalc;

public class Token {
    public String type;
    public String valeur;

    public Token(String type, String valeur) {
        this.type = type;
        this.valeur = valeur;
    }

    @Override
    public String toString() {
        return "Token(" + type + ", " + valeur + ")";
    }
}
