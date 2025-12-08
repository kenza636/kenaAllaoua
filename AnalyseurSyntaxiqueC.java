package com.mycompany.analyseurlexicalc;

import java.util.List;



public class AnalyseurSyntaxiqueC {

    private List<Token> tokens;  // tokens générés par l'analyseur lexical
    private int i;               // index courant
    private boolean r;           // état de validation

    public AnalyseurSyntaxiqueC(List<Token> tokens) {
        this.tokens = tokens;
        this.i = 0;
        this.r = true;

        // Ajouter un token spécial # à la fin pour simplifier la vérification
        tokens.add(new Token("Fin", "#"));
    }

    public void analyserProgramme() {
        S(); // commencer l'analyse
        if (r && tokens.get(i).valeur.equals("#")) {
            System.out.println("La chaîne est acceptée !");
        } else {
            System.out.println("Erreur de syntaxe !");
        }
    }

    // Instruction : do-while ou simple statement
    private void S() {
        if (!r) return;

        // do-while
        if (tokens.get(i).type.equals("MotCle") && tokens.get(i).valeur.equals("do")) {
            i++; // consommer 'do'
            ST(); // bloc ou instruction simple
            if (tokens.get(i).type.equals("MotCle") && tokens.get(i).valeur.equals("while")) {
                i++; // consommer 'while'
                if (tokens.get(i).type.equals("ParentheseOuvrante")) {
                    i++; // consommer '('
                    E(); // expression
                    if (tokens.get(i).type.equals("ParentheseFermante")) {
                        i++; // consommer ')'
                        if (tokens.get(i).type.equals("PointVirgule")) {
                            i++; // consommer ';'
                        } else {
                            erreur("Point-virgule manquant après while");
                        }
                    } else {
                        erreur("Parenthèse fermante manquante");
                    }
                } else {
                    erreur("Parenthèse ouvrante manquante après while");
                }
            } else {
                erreur("Mot-clé 'while' attendu");
            }
        } else {
            simpleStatement();
        }
    }

    // Bloc ou instruction simple
    private void ST() {
        if (!r) return;

        if (tokens.get(i).type.equals("AccoladeOuvrante")) {
            i++; // consommer '{'
            while (!tokens.get(i).type.equals("AccoladeFermante") && r) {
                S();
            }
            if (tokens.get(i).type.equals("AccoladeFermante")) {
                i++; // consommer '}'
            } else {
                erreur("Accolade fermante manquante");
            }
        } else {
            simpleStatement();
        }
    }

    // Instruction simple id = expression ;
    private void simpleStatement() {
        if (!r) return;

        if (tokens.get(i).type.equals("Identifiant")) {
            i++; // consommer identifiant
            if (tokens.get(i).type.equals("Egal")) {
                i++; // consommer '='
                E(); // expression
                if (tokens.get(i).type.equals("PointVirgule")) {
                    i++; // consommer ';'
                } else {
                    r = false;
                    erreur("Point-virgule manquant");
                }
            } else {
                r = false;
                erreur("'=' attendu");
            }
        } else {
            r = false;
            erreur("Instruction simple attendue");
        }
    }

    // Expression simple : id, nombre ou combinaison avec opérateur
    private void E() {
        if (!r) return;

        if (tokens.get(i).type.equals("Identifiant") || tokens.get(i).type.equals("Nombre")) {
            i++; // consommer id ou nombre
        } else {
            erreur("Expression invalide");
            return;
        }

        // Vérifier si opérateur suit
        if (tokens.get(i).type.equals("Addition") ||
            tokens.get(i).type.equals("Soustraction") ||
            tokens.get(i).type.equals("Multiplication") ||
            tokens.get(i).type.equals("Division") ||
            tokens.get(i).type.equals("Inferieur") ||
            tokens.get(i).type.equals("Superieur") ||
            tokens.get(i).type.equals("Egal") ||
            tokens.get(i).type.equals("Negation")) {
            i++; // consommer opérateur
            E(); // partie droite
        }
    }

    private void erreur(String msg) {
        r = false;
        System.out.println("Erreur : " + msg);
    }
}
