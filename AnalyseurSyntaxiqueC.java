package com.mycompany.analyseurlexicalc;

import java.util.List;

public class AnalyseurSyntaxiqueC {

    private List<Token> tokens;
    private int i;
    private boolean erreur = false;

    public AnalyseurSyntaxiqueC(List<Token> tokens) {
        this.tokens = tokens;
        this.i = 0;
        tokens.add(new Token("Fin", "#")); // token de fin
    }

    // ======================
    // Analyse du programme
    // ======================
    public void analyserProgramme() {
        if (look("MotCle", "int") && lookAhead(1, "Fonction", "main")) {
            i++; // int
            i++; // main
            expect("ParentheseOuvrante");
            expect("ParentheseFermante");
            expect("AccoladeOuvrante");

            while (!look("AccoladeFermante") && !lookVal("#")) {
                S();
                if (erreur) break;
            }

            expect("AccoladeFermante");
        } else {
            erreur = true;
        }

        if (erreur) {
            System.out.println("❌ La chaîne n'est PAS acceptée.");
        } else {
            System.out.println("✔ La chaîne est ACCEPTÉE !");
        }
    }

    // ======================
    // Instruction principale
    // ======================
    private void S() {
        if (erreur) return;

        if (look("MotCle", "do")) {
            i++;
            ST();
            expect("MotCle", "while");
            expect("ParentheseOuvrante");
            E();
            expect("ParentheseFermante");
            expect("PointVirgule");
            return;
        }

        if (look("MotCle", "int") || look("MotCle", "float") || look("MotCle", "char")) {
            Declaration();
            return;
        }

        if (look("MotCle", "return")) {
            ReturnStatement();
            return;
        }

        simpleStatement();
    }

    // ======================
    // Bloc d'instructions
    // ======================
    private void ST() {
        if (erreur) return;

        if (look("AccoladeOuvrante")) {
            i++;
            while (!look("AccoladeFermante") && !lookVal("#")) {
                S();
                if (erreur) return;
            }
            expect("AccoladeFermante");
        } else {
            simpleStatement();
        }
    }

    // ======================
    // Déclaration
    // ======================
    private void Declaration() {
        if (erreur) return;

        i++; // type
        expect("Identifiant");

        if (accept("Egal")) {
            E();
        }

        expect("PointVirgule");
    }

    // ======================
    // Instruction simple
    // ======================
    private void simpleStatement() {
        if (erreur) return;

        if (look("Identifiant")) {
            i++;
            if (accept("Operateur") || accept("Increment") || accept("Decrement")) {
                expect("PointVirgule");
                return;
            }

            expect("Egal");
            E();
            expect("PointVirgule");
            return;
        }

        if (look("Fonction")) {
            i++;
            expect("ParentheseOuvrante");
            // accepter des expressions ou des strings
            while (!look("ParentheseFermante") && !lookVal("#")) {
                if (look("String") || look("Identifiant") || look("Nombre")) {
                    i++;
                } else if (isOperateur()) {
                    i++;
                } else {
                    erreur = true;
                    return;
                }
            }
            expect("ParentheseFermante");
            expect("PointVirgule");
            return;
        }

        if (look("String")) {
            i++;
            return;
        }

        erreur = true;
    }

    // ======================
    // Return statement
    // ======================
    private void ReturnStatement() {
        expect("MotCle", "return");
        E();
        expect("PointVirgule");
    }

    // ======================
    // Expression
    // ======================
    private void E() {
        if (erreur) return;

        if (look("Identifiant") || look("Nombre") || look("String")) {
            i++;
        } else {
            erreur = true;
            return;
        }

        while (isOperateur()) {
            i++;
            if (look("Identifiant") || look("Nombre") || look("String")) {
                i++;
            } else {
                erreur = true;
                return;
            }
        }
    }

    private boolean isOperateur() {
        return look("Addition") || look("Soustraction") || look("Multiplication") || look("Division") ||
               look("Inferieur") || look("Superieur") || look("Egal") || look("Operateur");
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

    private void expect(String type) {
        if (!look(type)) {
            erreur = true;
            return;
        }
        i++;
    }

    private void expect(String type, String val) {
        if (!look(type, val)) {
            erreur = true;
            return;
        }
        i++;
    }

    private boolean lookAhead(int offset, String type, String val) {
        return (i + offset < tokens.size() &&
                tokens.get(i + offset).type.equals(type) &&
                tokens.get(i + offset).valeur.equals(val));
    }
}




