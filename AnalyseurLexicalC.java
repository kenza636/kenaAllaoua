package com.mycompany.analyseurlexicalc;

import java.util.ArrayList;
import java.util.List;

public class AnalyseurLexicalC {

    // Mots-clés C
    String[] motsCles = {
        "auto","break","case","char","const","continue","default","do","double",
        "else","enum","extern","float","for","goto","if","inline","int","long",
        "register","restrict","return","short","signed","sizeof","static","struct",
        "switch","typedef","union","unsigned","void","volatile","while",
        "_Bool","_Complex","_Imaginary",
        "allaoua", "kenza"
    };

    // Fonctions C courantes
    String[] fonctions = {
        "printf", "scanf", "main", "gets", "puts", "fgets", "fputs", 
        "strlen", "strcpy", "strcat", "malloc", "free"
    };

    // Méthode principale pour analyser un programme C et produire les tokens
    public List<Token> analyserProgrammeTokens(String[] programme) {
        List<Token> tokens = new ArrayList<>();

        for (String ligne : programme) {
            // Supprimer les commentaires //
            int idxComment = ligne.indexOf("//");
            if (idxComment != -1) ligne = ligne.substring(0, idxComment);

            // Supprimer les commentaires /* */
            while (ligne.contains("/*") && ligne.contains("*/")) {
                int debut = ligne.indexOf("/*");
                int fin = ligne.indexOf("*/");
                if (fin > debut) {
                    ligne = ligne.substring(0, debut) + ligne.substring(fin + 2);
                } else break;
            }

            ligne = ligne.trim();
            ligne += "#";  // marqueur de fin

            int i = 0;
            while (i < ligne.length()) {
                char c = ligne.charAt(i);

                // Fin de ligne
                if (c == '#') break;

                // Ignorer les espaces et tabulations
                if (c == ' ' || c == '\t') {
                    i++;
                    continue;
                }

                // Gérer les chaînes entre guillemets
                if (c == '"') {
                    StringBuilder str = new StringBuilder();
                    i++; // consommer le guillemet ouvrant
                    while (i < ligne.length() && ligne.charAt(i) != '"') {
                        str.append(ligne.charAt(i));
                        i++;
                    }
                    if (i < ligne.length() && ligne.charAt(i) == '"') i++; 
                    tokens.add(new Token("String", str.toString()));
                    continue;
                }

                // IDENTIFIANTS / MOTS-CLÉS / FONCTIONS
                if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_') {
                    String mot = "" + c;
                    i++;
                    while (i < ligne.length()) {
                        char cur = ligne.charAt(i);
                        if ((cur >= 'a' && cur <= 'z') || (cur >= 'A' && cur <= 'Z') || 
                            (cur >= '0' && cur <= '9') || cur == '_') {
                            mot += cur;
                            i++;
                        } else break;
                    }

                    boolean estMotCle = false;
                    for (String mc : motsCles)
                        if (mot.equals(mc)) { estMotCle = true; break; }

                    boolean estFonction = false;
                    for (String f : fonctions)
                        if (mot.equals(f)) { estFonction = true; break; }

                    if (estMotCle) tokens.add(new Token("MotCle", mot));
                    else if (estFonction) tokens.add(new Token("Fonction", mot));
                    else tokens.add(new Token("Identifiant", mot));

                    continue;
                }

                // NOMBRES
                if (c >= '0' && c <= '9') {
                    String nombre = "" + c;
                    boolean point = false;
                    i++;
                    while (i < ligne.length()) {
                        char cur = ligne.charAt(i);
                        if ((cur >= '0' && cur <= '9') || (!point && cur == '.')) {
                            if (cur == '.') point = true;
                            nombre += cur;
                            i++;
                        } else break;
                    }
                    tokens.add(new Token("Nombre", nombre));
                    continue;
                }

                // OPERATEURS DOUBLES
                if (i + 1 < ligne.length()) {
                    char suivant = ligne.charAt(i + 1);
                    String deux = "" + c + suivant;
                    if (deux.equals("==") || deux.equals("!=") ||
                        deux.equals("<=") || deux.equals(">=") ||
                        deux.equals("++") || deux.equals("--")) {
                        tokens.add(new Token("Operateur", deux));
                        i += 2; // consomme les deux caractères
                        continue;
                    }
                }

                // SYMBOLES SIMPLES
                String typeSymbole = switch (c) {
                    case '+' -> "Addition";
                    case '-' -> "Soustraction";
                    case '*' -> "Multiplication";
                    case '/' -> "Division";
                    case '=' -> "Egal";
                    case ';' -> "PointVirgule";
                    case '(' -> "ParentheseOuvrante";
                    case ')' -> "ParentheseFermante";
                    case '{' -> "AccoladeOuvrante";
                    case '}' -> "AccoladeFermante";
                    case '<' -> "Inferieur";
                    case '>' -> "Superieur";
                    case '&' -> "ET";
                    case '|' -> "OU";
                    case '!' -> "Negation";
                    case '%' -> "Modulo";
                    default -> null;
                };

                if (typeSymbole != null) {
                    tokens.add(new Token(typeSymbole, "" + c));
                    i++;
                    continue;
                }

                // CARACTERE NON RECONNU
                tokens.add(new Token("NonReconnu", "" + c));
                i++;
            }
        }

        return tokens;
    }
}





