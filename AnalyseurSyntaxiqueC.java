package com.mycompany.analyseurlexicalc;

import java.util.List;

public class AnalyseurSyntaxiqueC {

    private List<Token> tokens;
    private int i;

    public AnalyseurSyntaxiqueC(List<Token> tokens) {
        this.tokens = tokens;
        this.i = 0;
        tokens.add(new Token("Fin", "#")); // Token de fin
    }

    public void analyserProgramme() {
        while (i < tokens.size() && !lookVal("#")) {
            S();
        }
        System.out.println("La chaîne est acceptée !");
    }

    // Instruction principale
    private void S() {
        if (look("MotCle", "do")) {
            i++;
            ST();
            accept("MotCle", "while");
            accept("ParentheseOuvrante");
            E();
            accept("ParentheseFermante");
            accept("PointVirgule");
            return;
        }
        if (look("MotCle", "int") || look("MotCle", "float") || look("MotCle", "char")) {
            Declaration();
        } else if (look("MotCle", "return")) {
            ReturnStatement();
        } else {
            simpleStatement();
        }
    }

    private void ST() {
        if (look("AccoladeOuvrante")) {
            i++;
            while (!look("AccoladeFermante") && !lookVal("#") && i < tokens.size()) {
                S();
            }
            accept("AccoladeFermante");
        } else {
            simpleStatement();
        }
    }

    private void Declaration() {
        i++; // Type
        accept("Identifiant");
        accept("Egal");
        E();
        accept("PointVirgule");
    }

    private void simpleStatement() {
        if (look("Identifiant")) {
            accept("Identifiant");
            accept("Increment"); // i++
            accept("Decrement"); // i--
            accept("Egal");
            E();
            accept("PointVirgule");
        } else if (look("AppelFonction")) { // printf(...)
            accept("AppelFonction");
            accept("ParentheseOuvrante");
            E();
            accept("ParentheseFermante");
            accept("PointVirgule");
        } else {
            i++; // Ignorer token inconnu
        }
    }

    private void ReturnStatement() {
        accept("MotCle", "return");
        E();
        accept("PointVirgule");
    }

    private void E() {
        if (i >= tokens.size()) return;

        if (look("Identifiant") || look("Nombre") || look("String")) {
            i++;
        }

        if (isOperateur()) {
            i++;
            E();
        }
    }

    private boolean isOperateur() {
        return look("Addition") || look("Soustraction") ||
               look("Multiplication") || look("Division") ||
               look("Inferieur") || look("Superieur") || look("Egal");
    }

    private boolean look(String type) {
        return i < tokens.size() && tokens.get(i).type.equals(type);
    }

    private boolean look(String type, String val) {
        return look(type) && tokens.get(i).valeur.equals(val);
    }

    private boolean lookVal(String val) {
        return i < tokens.size() && tokens.get(i).valeur.equals(val);
    }

    private boolean accept(String type) {
        if (look(type)) { i++; return true; }
        return false;
    }

    private boolean accept(String type, String val) {
        if (look(type, val)) { i++; return true; }
        return false;
    }
}

