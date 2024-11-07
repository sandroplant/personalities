    •	Immediate Security Fixes
    •	SQL Injection
    ◦	ID: js/sql-injection
    ◦	Description: Using user-controlled data in SQL queries without proper sanitization can lead to SQL injection attacks.
    •	Cross-Site Scripting (XSS)
    ◦	Reflected XSS
    ▪	ID: js/reflected-xss
    ▪	Description: Writing user input directly to an HTTP response allows for a cross-site scripting vulnerability.
    ◦	Stored XSS
    ▪	ID: js/stored-xss
    ▪	Description: Using uncontrolled stored values in HTML allows for a stored cross-site scripting vulnerability.
    ◦	DOM-based XSS
    ▪	ID: js/xss-through-dom
    ▪	Description: Reinterpreting text from the DOM as HTML can lead to a cross-site scripting vulnerability.
    ◦	General XSS
    ▪	ID: js/xss
    ▪	Description: Writing user input directly to the DOM allows for a cross-site scripting vulnerability.
    •	Command Injection
    ◦	ID: js/command-line-injection
    ◦	Description: Using externally controlled strings in a command line may allow a malicious user to change the meaning of the command.
    ◦	ID: js/shell-command-constructed-from-input
    ◦	Description: Using externally controlled strings in a command line may allow a malicious user to change the meaning of the command.
    •	Prototype Pollution
    ◦	ID: js/prototype-polluting-assignment
    ◦	Description: Modifying an object obtained via a user-controlled property name may lead to accidental mutation of the built-in Object prototype, and possibly escalate to remote code execution or cross-site scripting.
    ◦	ID: js/prototype-pollution
    ◦	Description: Recursively merging a user-controlled object into another object can allow an attacker to modify the built-in Object prototype, and possibly escalate to remote code execution or cross-site scripting.
    •	XML External Entity (XXE)
    ◦	ID: js/xxe
    ◦	Description: Parsing user input as an XML document with external entity expansion is vulnerable to XXE attacks.
    •	Insecure Randomness
    ◦	ID: js/insecure-randomness
    ◦	Description: Using a cryptographically weak pseudo-random number generator to generate a security-sensitive value may allow an attacker to predict what value will be generated.
    •	Hard-Coded Credentials
    ◦	ID: js/hardcoded-credentials
    ◦	Description: Hard-coding credentials in source code may enable an attacker to gain unauthorized access.
    •	Clear Text Storage of Sensitive Information
    ◦	ID: js/clear-text-storage-of-sensitive-data
    ◦	Description: Sensitive information stored without encryption or hashing can expose it to an attacker.
    •	Clear-Text Logging of Sensitive Information
    ◦	ID: js/clear-text-logging
    ◦	Description: Logging sensitive information without encryption or hashing can expose it to an attacker.
    •	Deserialization of User-Controlled Data
    ◦	ID: js/unsafe-deserialization
    ◦	Description: Deserializing user-controlled data may allow attackers to execute arbitrary code.
    •	Unvalidated Dynamic Method Call
    ◦	ID: js/unvalidated-dynamic-method-call
    ◦	Description: Calling a method with a user-controlled name may dispatch to an unexpected target, which could cause an exception.
    •	Uncontrolled Command Line
    ◦	ID: js/command-line-injection
    ◦	Description: Using externally controlled strings in a command line may allow a malicious user to change the meaning of the command.
    •	Unsafe Shell Command Constructed from Library Input
    ◦	ID: js/shell-command-constructed-from-input
    ◦	Description: Using externally controlled strings in a command line may allow a malicious user to change the meaning of the command.
    •	Second Order Command Injection
    ◦	ID: js/second-order-command-line-injection
    ◦	Description: Using user-controlled data as arguments to some commands, such as git clone, can allow arbitrary commands to be executed.
    •	Shell Command Built from Environment Values
    ◦	ID: js/shell-command-injection-from-environment
    ◦	Description: Building a shell command string with values from the enclosing environment may cause subtle bugs or vulnerabilities.
    •	XPath Injection
    ◦	ID: js/xpath-injection
    ◦	Description: Building an XPath expression from user-controlled sources is vulnerable to insertion of malicious code by the user.
    •	Download of Sensitive File Through Insecure Connection
    ◦	ID: js/insecure-download
    ◦	Description: Downloading executables and other sensitive files over an insecure connection opens up for potential man-in-the-middle attacks.
    •	Arbitrary File Access During Archive Extraction ("Zip Slip")
    ◦	ID: js/zipslip
    ◦	Description: Extracting files from a malicious ZIP file, or similar type of archive, without validating that the destination file path is within the destination directory can allow an attacker to unexpectedly gain access to resources.
    •	Uncontrolled Data Used in Path Expression
    ◦	ID: js/path-injection
    ◦	Description: Accessing paths influenced by users can allow an attacker to access unexpected resources.
    •
